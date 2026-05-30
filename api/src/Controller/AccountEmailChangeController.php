<?php

namespace App\Controller;

use App\Entity\EmailChangeRequest;
use App\Entity\User;
use App\Repository\EmailChangeRequestRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;

final class AccountEmailChangeController extends AbstractController
{
    private const EMAIL_CHANGE_TTL_IN_SECONDS = 86400;

    #[Route('/api/me/email-change', name: 'api_me_email_change_request', methods: ['POST'])]
    public function requestChange(
        Request $request,
        UserRepository $userRepository,
        EmailChangeRequestRepository $emailChangeRequestRepository,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer,
        #[Autowire('%env(string:FRONTEND_APP_URL)%')]
        string $frontendAppUrl,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $data = $request->toArray();
        $newEmail = mb_strtolower(trim((string) ($data['newEmail'] ?? '')));
        $currentEmail = mb_strtolower(trim((string) ($user->getEmail() ?? '')));

        if ('' === $newEmail) {
            return $this->json([
                'message' => 'Renseigne le nouvel email a utiliser.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (false === filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
            return $this->json([
                'message' => 'Le nouvel email est invalide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($newEmail === $currentEmail) {
            return $this->json([
                'message' => 'Choisis une adresse differente de ton email actuel.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $existingUser = $userRepository->findOneBy(['email' => $newEmail]);

        if ($existingUser instanceof User && $existingUser->getId() !== $user->getId()) {
            return $this->json([
                'message' => 'Cette adresse email est deja utilisee.',
            ], Response::HTTP_CONFLICT);
        }

        $now = new \DateTimeImmutable();
        $emailChangeRequestRepository->markActiveRequestsAsUsedForUser($user, $now);

        $rawToken = bin2hex(random_bytes(32));
        $emailChangeRequest = (new EmailChangeRequest())
            ->setUser($user)
            ->setCurrentEmail($currentEmail)
            ->setNewEmail($newEmail)
            ->setTokenHash(hash('sha256', $rawToken))
            ->setRequestedAt($now)
            ->setExpiresAt($now->modify('+'.self::EMAIL_CHANGE_TTL_IN_SECONDS.' seconds'));

        $confirmationUrl = rtrim($frontendAppUrl, '/').'/account/email-change/confirm?token='.urlencode($rawToken);

        $entityManager->persist($emailChangeRequest);
        $entityManager->flush();

        try {
            $mailer->send(
                (new Email())
                    ->from('no-reply@eventflow.local')
                    ->to($currentEmail)
                    ->subject('Validation du changement d email EventFlow')
                    ->text(
                        "Bonjour,\n\n".
                        "Tu as demande le changement de ton adresse EventFlow vers : ".$newEmail."\n\n".
                        "Pour confirmer cette modification, ouvre ce lien :\n".
                        $confirmationUrl."\n\n".
                        "Ce lien reste valide pendant 24 heures.\n"
                    )
            );
        } catch (\Throwable) {
            return $this->json([
                'message' => "Impossible d'envoyer l'email de validation pour le moment.",
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return $this->json([
            'message' => "Un email de validation a ete envoye sur ton adresse actuelle.",
        ], Response::HTTP_CREATED);
    }

    #[Route('/api/email-change/confirm', name: 'api_email_change_confirm', methods: ['POST'])]
    public function confirmChange(
        Request $request,
        UserRepository $userRepository,
        EmailChangeRequestRepository $emailChangeRequestRepository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $data = $request->toArray();
        $rawToken = trim((string) ($data['token'] ?? ''));

        if ('' === $rawToken) {
            return $this->json([
                'message' => 'Le lien de confirmation est invalide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $now = new \DateTimeImmutable();
        $emailChangeRequest = $emailChangeRequestRepository->findActiveByToken($rawToken, $now);

        if (
            !$emailChangeRequest instanceof EmailChangeRequest
            || !$emailChangeRequest->getUser() instanceof User
        ) {
            return $this->json([
                'message' => 'Le lien de confirmation est invalide ou expire.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $user = $emailChangeRequest->getUser();
        $nextEmail = mb_strtolower(trim((string) $emailChangeRequest->getNewEmail()));
        $existingUser = $userRepository->findOneBy(['email' => $nextEmail]);

        if ($existingUser instanceof User && $existingUser->getId() !== $user->getId()) {
            return $this->json([
                'message' => 'Cette adresse email est deja utilisee par un autre compte.',
            ], Response::HTTP_CONFLICT);
        }

        $user->setEmail($nextEmail);
        $emailChangeRequestRepository->markActiveRequestsAsUsedForUser($user, $now);
        $emailChangeRequest->setUsedAt($now);

        foreach ($user->getNewsletterSubscriptions() as $newsletterSubscription) {
            $newsletterSubscription
                ->setEmail($nextEmail)
                ->setUpdatedAt($now);
            $entityManager->persist($newsletterSubscription);
        }

        $entityManager->persist($user);
        $entityManager->flush();

        if ($request->hasSession()) {
            $request->getSession()->invalidate();
        }

        return $this->json([
            'message' => "Ton adresse email a ete mise a jour. Reconnecte-toi avec cette nouvelle adresse.",
        ], Response::HTTP_OK);
    }
}
