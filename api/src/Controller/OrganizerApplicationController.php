<?php

namespace App\Controller;

use App\Entity\OrganizerApplication;
use App\Entity\User;
use App\Repository\OrganizerApplicationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/organizer-application')]
#[IsGranted('ROLE_USER')]
final class OrganizerApplicationController extends AbstractController
{
    #[Route('/me', name: 'api_organizer_application_me', methods: ['GET'])]
    public function me(OrganizerApplicationRepository $organizerApplicationRepository): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], 401);
        }

        $application = $organizerApplicationRepository->findOneForUser($user);

        return $this->json([
            'application' => $application instanceof OrganizerApplication
                ? $this->serializeApplication($application)
                : null,
        ]);
    }

    #[Route('', name: 'api_organizer_application_submit', methods: ['POST'])]
    public function submit(
        Request $request,
        OrganizerApplicationRepository $organizerApplicationRepository,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer,
        #[Autowire('%env(string:ORGANIZER_REVIEW_EMAIL)%')]
        string $reviewEmail,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], 401);
        }

        if ($user->isOrganizerOrAdmin()) {
            return $this->json([
                'message' => 'Ton accès organisateur est déjà actif.',
            ], 409);
        }

        $data = $request->toArray();
        $organizationName = trim((string) ($data['organizationName'] ?? ''));
        $city = trim((string) ($data['city'] ?? ''));
        $motivation = trim((string) ($data['motivation'] ?? ''));
        $phone = $this->normalizeNullableString($data['phone'] ?? null);
        $website = $this->normalizeNullableString($data['website'] ?? null);
        $instagramUrl = $this->normalizeNullableString($data['instagramUrl'] ?? null);
        $tiktokUrl = $this->normalizeNullableString($data['tiktokUrl'] ?? null);
        $linkedinUrl = $this->normalizeNullableString($data['linkedinUrl'] ?? null);
        $otherLinks = $this->normalizeNullableString($data['otherLinks'] ?? null);

        if ('' === $organizationName || '' === $city || '' === $motivation) {
            return $this->json([
                'message' => 'Les champs organisation, ville et presentation sont obligatoires.',
            ], 400);
        }

        $application = $organizerApplicationRepository->findOneForUser($user) ?? new OrganizerApplication();
        $isNewApplication = null === $application->getId();

        if ($application->getStatus() === OrganizerApplication::STATUS_APPROVED) {
            return $this->json([
                'message' => 'Ta demande organisateur a déjà ete approuvée.',
                'application' => $this->serializeApplication($application),
            ], 409);
        }

        $now = new \DateTimeImmutable();

        $application
            ->setUser($user)
            ->setOrganizationName($organizationName)
            ->setCity($city)
            ->setPhone($phone)
            ->setWebsite($website)
            ->setInstagramUrl($instagramUrl)
            ->setTiktokUrl($tiktokUrl)
            ->setLinkedinUrl($linkedinUrl)
            ->setOtherLinks($otherLinks)
            ->setMotivation($motivation)
            ->setReviewNote(null)
            ->setReviewedAt(null)
            ->setSubmittedAt($now)
            ->setStatus(OrganizerApplication::STATUS_PENDING)
        ;

        $user->setOrganizerApplication($application);

        $entityManager->persist($application);
        $entityManager->persist($user);
        $entityManager->flush();

        $this->sendSubmissionEmails($mailer, $reviewEmail, $user, $application);

        return $this->json([
            'message' => $isNewApplication
                ? 'Ta demande organisateur a bien été envoyée.'
                : 'Ta demande organisateur a bien été mise à jour et renvoyée.',
            'application' => $this->serializeApplication($application),
        ], $isNewApplication ? 201 : 200);
    }

    private function sendSubmissionEmails(
        MailerInterface $mailer,
        string $reviewEmail,
        User $user,
        OrganizerApplication $application,
    ): void {
        $fullName = trim(sprintf('%s %s', $user->getFirstName(), $user->getLastName()));

        try {
            $mailer->send(
                (new Email())
                    ->from('no-reply@eventflow.local')
                    ->to($reviewEmail)
                    ->subject('Nouvelle demande organisateur EventFlow')
                    ->text(
                        "Nouvelle demande organisateur reçue.\n\n".
                        "Compte: {$fullName}\n".
                        "Email: {$user->getEmail()}\n".
                        "Structure: {$application->getOrganizationName()}\n".
                        "Ville: {$application->getCity()}\n".
                        "Site: ".($application->getWebsite() ?? '-')."\n".
                        "Instagram: ".($application->getInstagramUrl() ?? '-')."\n".
                        "TikTok: ".($application->getTiktokUrl() ?? '-')."\n".
                        "LinkedIn: ".($application->getLinkedinUrl() ?? '-')."\n".
                        "Autres liens: ".($application->getOtherLinks() ?? '-')."\n\n".
                        "Presentation:\n{$application->getMotivation()}\n"
                    )
            );

            if (null !== $user->getEmail()) {
                $mailer->send(
                    (new Email())
                        ->from('no-reply@eventflow.local')
                        ->to((string) $user->getEmail())
                        ->subject('Ta demande organisateur EventFlow a été reçue')
                        ->text(
                            "Bonjour {$fullName},\n\n".
                            "Nous avons bien reçu ta demande organisateur pour {$application->getOrganizationName()}.\n".
                            "Notre équipe va vérifier les informations publiques envoyées puis revenir vers toi par email.\n"
                        )
                );
            }
        } catch (\Throwable) {
            // The organizer flow should not fail just because email delivery is noisy in dev.
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
     *   reviewedAt: string|null
     * }
     */
    private function serializeApplication(OrganizerApplication $application): array
    {
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
