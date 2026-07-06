<?php

namespace App\Controller;

use App\Entity\OrganizerApplication;
use App\Entity\User;
use App\Repository\OrganizerApplicationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/organizer-applications')]
#[IsGranted('ROLE_ADMIN_SUPPORT')]
final class AdminOrganizerApplicationController extends AbstractController
{
    #[Route('', name: 'api_admin_organizer_application_index', methods: ['GET'])]
    public function index(OrganizerApplicationRepository $organizerApplicationRepository): JsonResponse
    {
        $applications = $organizerApplicationRepository->findForAdminReview();

        return $this->json(array_map(
            fn (OrganizerApplication $application): array => $this->serializeApplication($application),
            $applications,
        ));
    }

    #[Route('/{id}', name: 'api_admin_organizer_application_show', methods: ['GET'])]
    public function show(OrganizerApplication $application): JsonResponse
    {
        return $this->json($this->serializeApplication($application));
    }

    #[Route('/{id}/approve', name: 'api_admin_organizer_application_approve', methods: ['POST'])]
    public function approve(
        OrganizerApplication $application,
        Request $request,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer,
    ): JsonResponse {
        $data = $request->toArray();
        $reviewNote = $this->normalizeNullableString($data['reviewNote'] ?? null);
        $now = new \DateTimeImmutable();
        $user = $application->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Le compte lié à cette demande est introuvable.',
            ], 404);
        }

        $application
            ->setStatus(OrganizerApplication::STATUS_APPROVED)
            ->setReviewNote($reviewNote)
            ->setReviewedAt($now)
        ;

        if (!$user->isAdminAccount()) {
            $user->setRole(User::ROLE_ORGANIZER);
        }

        $entityManager->persist($application);
        $entityManager->persist($user);
        $entityManager->flush();

        $this->sendDecisionEmail($mailer, $user, $application, true);

        return $this->json([
            'message' => 'La demande organisateur a été approuvée.',
            'application' => $this->serializeApplication($application),
        ]);
    }

    #[Route('/{id}/reject', name: 'api_admin_organizer_application_reject', methods: ['POST'])]
    public function reject(
        OrganizerApplication $application,
        Request $request,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer,
    ): JsonResponse {
        $user = $application->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Le compte lié à cette demande est introuvable.',
            ], 404);
        }

        $data = $request->toArray();
        $reviewNote = $this->normalizeNullableString($data['reviewNote'] ?? null);

        if (null === $reviewNote) {
            return $this->json([
                'message' => 'Ajoute une note de retour pour expliquer le refus.',
            ], 400);
        }

        $wasApproved = OrganizerApplication::STATUS_APPROVED === $application->getStatus();

        $application
            ->setStatus(OrganizerApplication::STATUS_REJECTED)
            ->setReviewNote($reviewNote)
            ->setReviewedAt(new \DateTimeImmutable())
        ;

        if (!$user->isAdminAccount()) {
            $user->setRole(User::ROLE_CLIENT);
        }

        $entityManager->persist($application);
        $entityManager->persist($user);
        $entityManager->flush();

        $this->sendDecisionEmail($mailer, $user, $application, false);

        return $this->json([
            'message' => $wasApproved
                ? 'Le rôle organisateur a été retiré et le compte est repassé client.'
                : 'La demande organisateur a été refusée.',
            'application' => $this->serializeApplication($application),
        ]);
    }

    private function sendDecisionEmail(
        MailerInterface $mailer,
        User $user,
        OrganizerApplication $application,
        bool $approved,
    ): void {
        $email = $user->getEmail();

        if (null === $email) {
            return;
        }

        $fullName = trim(sprintf('%s %s', $user->getFirstName(), $user->getLastName()));
        $subject = $approved
            ? 'Ta demande organisateur EventFlow a été approuvée'
            : 'Mise à jour de ta demande organisateur EventFlow';
        $body = $approved
            ? "Bonjour {$fullName},\n\n".
                "Bonne nouvelle: ta demande organisateur pour {$application->getOrganizationName()} a été approuvée.\n".
                "Tu peux maintenant accéder à ton espace organisateur EventFlow.\n\n".
                ($application->getReviewNote() ? "Note de l’équipe :\n{$application->getReviewNote()}\n" : '')
            : "Bonjour {$fullName},\n\n".
                "Ta demande organisateur pour {$application->getOrganizationName()} a été relue, mais elle ne peut pas encore être validée.\n\n".
                "Retour de l’équipe :\n{$application->getReviewNote()}\n\n".
                "Tu peux mettre à jour ta demande puis la renvoyer depuis ton espace EventFlow.\n";

        try {
            $mailer->send(
                (new Email())
                    ->from('no-reply@eventflow.local')
                    ->to($email)
                    ->subject($subject)
                    ->text($body)
            );
        } catch (\Throwable) {
            // Keep the admin decision flow usable even if mail delivery is noisy in dev.
        }
    }

    /**
     * @return array{
     *   id: int|null,
     *   status: string|null,
     *   organizationName: string|null,
     *   city: string|null,
     *   phone: string|null,
     *   website: string|null,
     *   instagramUrl: string|null,
     *   tiktokUrl: string|null,
     *   linkedinUrl: string|null,
     *   otherLinks: string|null,
     *   motivation: string|null,
     *   reviewNote: string|null,
     *   submittedAt: string|null,
     *   reviewedAt: string|null,
     *   applicant: array{id: int|null, fullName: string, email: string|null, role: string|null, profilePhoto: string|null}
     * }
     */
    private function serializeApplication(OrganizerApplication $application): array
    {
        $user = $application->getUser();
        $fullName = $user instanceof User
            ? trim(sprintf('%s %s', $user->getFirstName(), $user->getLastName()))
            : '';

        return [
            'id' => $application->getId(),
            'status' => $application->getStatus(),
            'organizationName' => $application->getOrganizationName(),
            'city' => $application->getCity(),
            'phone' => $application->getPhone(),
            'website' => $application->getWebsite(),
            'instagramUrl' => $application->getInstagramUrl(),
            'tiktokUrl' => $application->getTiktokUrl(),
            'linkedinUrl' => $application->getLinkedinUrl(),
            'otherLinks' => $application->getOtherLinks(),
            'motivation' => $application->getMotivation(),
            'reviewNote' => $application->getReviewNote(),
            'submittedAt' => $application->getSubmittedAt()?->format(DATE_ATOM),
            'reviewedAt' => $application->getReviewedAt()?->format(DATE_ATOM),
            'applicant' => [
                'id' => $user?->getId(),
                'fullName' => $fullName,
                'email' => $user?->getEmail(),
                'role' => $user?->getBaseRole(),
                'profilePhoto' => $user?->getProfilePhoto(),
            ],
        ];
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' !== $value ? $value : null;
    }
}
