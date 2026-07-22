<?php

namespace App\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

final class JsonAuthenticationFailureHandler implements AuthenticationFailureHandlerInterface
{
    private const MAX_FAILED_LOGIN_ATTEMPTS = 3;

    public function __construct(
        private readonly TranslatorInterface $translator,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): JsonResponse
    {
        $message = $this->translator->trans(
            $exception->getMessageKey(),
            $exception->getMessageData(),
            'security'
        );

        if ($exception instanceof BadCredentialsException) {
            $message = $this->trackFailedLoginAttempt($request, $message);
        }

        return new JsonResponse([
            'message' => $message,
        ], JsonResponse::HTTP_UNAUTHORIZED);
    }

    private function trackFailedLoginAttempt(Request $request, string $defaultMessage): string
    {
        $email = $this->extractEmail($request);

        if (null === $email) {
            return $defaultMessage;
        }

        $user = $this->userRepository->findOneByEmailInsensitive($email);

        if (!$user instanceof User || !$user->canAuthenticate()) {
            return $defaultMessage;
        }

        $attempts = $user->incrementFailedLoginAttempts();

        if ($attempts >= self::MAX_FAILED_LOGIN_ATTEMPTS) {
            $user->setAccountStatus(User::ACCOUNT_STATUS_BLOCKED);
            $this->entityManager->flush();

            return 'Ce compte est bloqué après trois échecs de connexion. Contacte le support EventFlow.';
        }

        $this->entityManager->flush();

        return $defaultMessage;
    }

    private function extractEmail(Request $request): ?string
    {
        $email = $request->request->get('email');

        if (is_string($email) && '' !== trim($email)) {
            return mb_strtolower(trim($email));
        }

        try {
            $payload = $request->toArray();
        } catch (\Throwable) {
            return null;
        }

        $email = $payload['email'] ?? null;

        return is_string($email) && '' !== trim($email)
            ? mb_strtolower(trim($email))
            : null;
    }
}
