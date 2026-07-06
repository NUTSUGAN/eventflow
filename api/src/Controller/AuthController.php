<?php

namespace App\Controller;

use App\Entity\NewsletterSubscription;
use App\Entity\PasswordResetRequest;
use App\Entity\User;
use App\Entity\UserOauthAccount;
use App\Repository\NewsletterSubscriptionRepository;
use App\Repository\PasswordResetRequestRepository;
use App\Repository\UserOauthAccountRepository;
use App\Repository\UserRepository;
use App\Service\UploadedImageStorage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class AuthController extends AbstractController
{
    public function __construct(
        private readonly UploadedImageStorage $imageStorage,
    ) {
    }

    private const GOOGLE_PROVIDER = 'google';
    private const GOOGLE_STATE_SESSION_KEY = 'auth.google.state';
    private const GOOGLE_PENDING_SESSION_KEY = 'auth.google.pending';
    private const PASSWORD_RESET_TTL_IN_SECONDS = 3600;
    private const PASSWORD_REQUIREMENTS_MESSAGE = 'Le mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial.';

    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        return $this->json([
            'message' => 'Connexion prise en charge par Symfony Security.',
        ], Response::HTTP_OK);
    }

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        UserRepository $userRepository,
        NewsletterSubscriptionRepository $newsletterSubscriptionRepository,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $data = $request->toArray();

        if (
            empty($data['email']) ||
            empty($data['password']) ||
            empty($data['firstName']) ||
            empty($data['lastName'])
        ) {
            return $this->json([
                'message' => 'Champs obligatoires manquants.',
            ], 400);
        }

        $acceptTerms = $this->toBoolean($data['acceptTerms'] ?? false);
        $acceptPrivacy = $this->toBoolean($data['acceptPrivacy'] ?? false);
        $subscribeToNewsletter = $this->toBoolean($data['subscribeToNewsletter'] ?? false);

        if (!$acceptTerms || !$acceptPrivacy) {
            return $this->json([
                'message' => 'Le consentement aux conditions d’utilisation et à la politique de confidentialité est obligatoire.',
            ], 400);
        }

        if ($userRepository->findOneBy(['email' => $data['email']])) {
            return $this->json([
                'message' => 'Cet email existe déjà.',
            ], 409);
        }

        $passwordValidationError = $this->validatePassword((string) $data['password']);

        if (null !== $passwordValidationError) {
            return $this->json([
                'message' => $passwordValidationError,
            ], 400);
        }

        $now = new \DateTimeImmutable();

        $user = new User();
        $user->setEmail(trim((string) $data['email']));
        $user->setFirstName(trim((string) $data['firstName']));
        $user->setLastName(trim((string) $data['lastName']));
        $user->setRole(User::ROLE_CLIENT);
        $user->setAccountStatus(User::ACCOUNT_STATUS_ACTIVE);
        $user->setTermsAcceptedAt($now);
        $user->setPrivacyAcceptedAt($now);
        $user->setCreatedAt($now);

        $hashedPassword = $passwordHasher->hashPassword($user, (string) $data['password']);
        $user->setPasswordHash($hashedPassword);

        if ($subscribeToNewsletter) {
            $this->upsertNewsletterSubscription(
                $user,
                $newsletterSubscriptionRepository,
                $entityManager,
                $now,
                NewsletterSubscription::SOURCE_REGISTER,
            );
        }

        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json([
            'message' => 'Utilisateur crée avec succès.',
            'newsletterSubscribed' => $subscribeToNewsletter,
            'user' => $this->serializeUser($user),
        ], 201);
    }

    #[Route('/api/auth/google/redirect', name: 'api_auth_google_redirect', methods: ['GET'])]
    public function googleRedirect(
        Request $request,
        SessionInterface $session,
        #[Autowire('%env(string:GOOGLE_OAUTH_CLIENT_ID)%')]
        string $googleClientId,
        #[Autowire('%env(string:GOOGLE_OAUTH_REDIRECT_URI)%')]
        string $googleRedirectUri,
        #[Autowire('%env(string:FRONTEND_APP_URL)%')]
        string $frontendAppUrl,
    ): RedirectResponse {
        if ('' === trim($googleClientId) || '' === trim($googleRedirectUri)) {
            return $this->redirect(
                $this->buildFrontendAuthUrl($frontendAppUrl, [
                    'mode' => $this->sanitizeMode((string) $request->query->get('mode', 'login')),
                    'intent' => $this->sanitizeIntent((string) $request->query->get('intent', '')),
                    'google' => 'configuration_error',
                ])
            );
        }

        $state = bin2hex(random_bytes(32));
        $session->set(self::GOOGLE_STATE_SESSION_KEY, [
            'token' => $state,
            'intent' => $this->sanitizeIntent((string) $request->query->get('intent', '')),
            'mode' => $this->sanitizeMode((string) $request->query->get('mode', 'login')),
        ]);

        $googleAuthorizeUrl = 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => $googleClientId,
            'redirect_uri' => $googleRedirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'prompt' => 'select_account',
        ]);

        return $this->redirect($googleAuthorizeUrl);
    }

    #[Route('/api/auth/google/callback', name: 'api_auth_google_callback', methods: ['GET'])]
    public function googleCallback(
        Request $request,
        SessionInterface $session,
        UserRepository $userRepository,
        UserOauthAccountRepository $oauthAccountRepository,
        EntityManagerInterface $entityManager,
        Security $security,
        #[Autowire('%env(string:GOOGLE_OAUTH_CLIENT_ID)%')]
        string $googleClientId,
        #[Autowire('%env(string:GOOGLE_OAUTH_CLIENT_SECRET)%')]
        string $googleClientSecret,
        #[Autowire('%env(string:GOOGLE_OAUTH_REDIRECT_URI)%')]
        string $googleRedirectUri,
        #[Autowire('%env(string:FRONTEND_APP_URL)%')]
        string $frontendAppUrl,
    ): RedirectResponse {
        $stateData = $session->get(self::GOOGLE_STATE_SESSION_KEY);
        $session->remove(self::GOOGLE_STATE_SESSION_KEY);

        $intent = is_array($stateData) ? $this->sanitizeIntent((string) ($stateData['intent'] ?? '')) : '';

        if (
            !is_array($stateData) ||
            !isset($stateData['token']) ||
            !hash_equals((string) $stateData['token'], (string) $request->query->get('state', ''))
        ) {
            return $this->redirect(
                $this->buildFrontendAuthUrl($frontendAppUrl, [
                    'mode' => 'login',
                    'intent' => $intent,
                    'google' => 'invalid_state',
                ])
            );
        }

        $authorizationCode = trim((string) $request->query->get('code', ''));

        if ('' === $authorizationCode) {
            return $this->redirect(
                $this->buildFrontendAuthUrl($frontendAppUrl, [
                    'mode' => 'login',
                    'intent' => $intent,
                    'google' => 'missing_code',
                ])
            );
        }

        try {
            $httpClient = HttpClient::create();
            $tokenResponse = $httpClient->request('POST', 'https://oauth2.googleapis.com/token', [
                'body' => [
                    'code' => $authorizationCode,
                    'client_id' => $googleClientId,
                    'client_secret' => $googleClientSecret,
                    'redirect_uri' => $googleRedirectUri,
                    'grant_type' => 'authorization_code',
                ],
            ])->toArray();

            $accessToken = isset($tokenResponse['access_token']) ? (string) $tokenResponse['access_token'] : '';

            if ('' === $accessToken) {
                throw new \RuntimeException('Token Google introuvable.');
            }

            $googleUserInfo = $httpClient->request(
                'GET',
                'https://openidconnect.googleapis.com/v1/userinfo',
                [
                    'auth_bearer' => $accessToken,
                ]
            )->toArray();
        } catch (\Throwable) {
            return $this->redirect(
                $this->buildFrontendAuthUrl($frontendAppUrl, [
                    'mode' => 'login',
                    'intent' => $intent,
                    'google' => 'request_failed',
                ])
            );
        }

        $providerUserId = trim((string) ($googleUserInfo['sub'] ?? ''));
        $providerEmail = trim((string) ($googleUserInfo['email'] ?? ''));

        if ('' === $providerUserId || '' === $providerEmail) {
            return $this->redirect(
                $this->buildFrontendAuthUrl($frontendAppUrl, [
                    'mode' => 'login',
                    'intent' => $intent,
                    'google' => 'missing_profile',
                ])
            );
        }

        $oauthAccount = $oauthAccountRepository->findOneBy([
            'provider' => self::GOOGLE_PROVIDER,
            'providerUserId' => $providerUserId,
        ]);

        $firstName = $this->resolveFirstName($googleUserInfo);
        $lastName = $this->resolveLastName($googleUserInfo);
        $profilePhoto = $this->normalizeNullableString($googleUserInfo['picture'] ?? null);

        if ($oauthAccount instanceof UserOauthAccount && $oauthAccount->getUser() instanceof User) {
            $user = $oauthAccount->getUser();

            if (!$user->canAuthenticate()) {
                return $this->redirectBlockedAccount($frontendAppUrl, $intent);
            }

            if (null === $user->getProfilePhoto() && null !== $profilePhoto) {
                $user->setProfilePhoto($profilePhoto);
                $entityManager->flush();
            }

            $security->login($user);

            return $this->redirect(
                $this->buildFrontendAuthUrl($frontendAppUrl, [
                    'mode' => 'login',
                    'intent' => $intent,
                    'google' => 'success',
                ])
            );
        }

        $existingUser = $userRepository->findOneBy([
            'email' => $providerEmail,
        ]);

        if (
            $existingUser instanceof User &&
            $existingUser->getTermsAcceptedAt() instanceof \DateTimeImmutable &&
            $existingUser->getPrivacyAcceptedAt() instanceof \DateTimeImmutable
        ) {
            if (!$existingUser->canAuthenticate()) {
                return $this->redirectBlockedAccount($frontendAppUrl, $intent);
            }

            if (null === $existingUser->getProfilePhoto() && null !== $profilePhoto) {
                $existingUser->setProfilePhoto($profilePhoto);
            }

            $linkedOauthAccount = (new UserOauthAccount())
                ->setUser($existingUser)
                ->setProvider(self::GOOGLE_PROVIDER)
                ->setProviderUserId($providerUserId)
                ->setProviderEmail($providerEmail)
                ->setCreatedAt(new \DateTimeImmutable())
            ;

            $existingUser->addOauthAccount($linkedOauthAccount);
            $entityManager->persist($linkedOauthAccount);
            $entityManager->flush();

            $security->login($existingUser);

            return $this->redirect(
                $this->buildFrontendAuthUrl($frontendAppUrl, [
                    'mode' => 'login',
                    'intent' => $intent,
                    'google' => 'success',
                ])
            );
        }

        $session->set(self::GOOGLE_PENDING_SESSION_KEY, [
            'provider' => self::GOOGLE_PROVIDER,
            'providerUserId' => $providerUserId,
            'providerEmail' => $providerEmail,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'profilePhoto' => $profilePhoto,
            'existingUserId' => $existingUser?->getId(),
            'intent' => $intent,
        ]);

        return $this->redirect(
            $this->buildFrontendAuthUrl($frontendAppUrl, [
                'mode' => 'google-complete',
                'intent' => $intent,
            ])
        );
    }

    #[Route('/api/auth/google/pending', name: 'api_auth_google_pending', methods: ['GET'])]
    public function googlePending(SessionInterface $session): JsonResponse
    {
        $pendingGoogleAuth = $session->get(self::GOOGLE_PENDING_SESSION_KEY);

        if (!is_array($pendingGoogleAuth)) {
            return $this->json([
                'message' => 'Aucune finalisation Google en attente.',
            ], 404);
        }

        return $this->json([
            'email' => (string) ($pendingGoogleAuth['providerEmail'] ?? ''),
            'firstName' => (string) ($pendingGoogleAuth['firstName'] ?? ''),
            'lastName' => (string) ($pendingGoogleAuth['lastName'] ?? ''),
            'profilePhoto' => $pendingGoogleAuth['profilePhoto'] ?? null,
            'existingUser' => isset($pendingGoogleAuth['existingUserId']) && null !== $pendingGoogleAuth['existingUserId'],
            'intent' => $this->sanitizeIntent((string) ($pendingGoogleAuth['intent'] ?? '')),
        ]);
    }

    #[Route('/api/auth/google/finalize', name: 'api_auth_google_finalize', methods: ['POST'])]
    public function googleFinalize(
        Request $request,
        SessionInterface $session,
        UserRepository $userRepository,
        UserOauthAccountRepository $oauthAccountRepository,
        NewsletterSubscriptionRepository $newsletterSubscriptionRepository,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        Security $security
    ): JsonResponse {
        $pendingGoogleAuth = $session->get(self::GOOGLE_PENDING_SESSION_KEY);

        if (!is_array($pendingGoogleAuth)) {
            return $this->json([
                'message' => 'Aucune finalisation Google en attente.',
            ], 400);
        }

        $data = $request->toArray();
        $acceptTerms = $this->toBoolean($data['acceptTerms'] ?? false);
        $acceptPrivacy = $this->toBoolean($data['acceptPrivacy'] ?? false);
        $subscribeToNewsletter = $this->toBoolean($data['subscribeToNewsletter'] ?? false);

        if (!$acceptTerms || !$acceptPrivacy) {
            return $this->json([
                'message' => 'Le consentement aux conditions d’utilisation et à la politique de confidentialité est obligatoire.',
            ], 400);
        }

        $now = new \DateTimeImmutable();
        $existingUserId = $pendingGoogleAuth['existingUserId'] ?? null;
        $user = null;

        if (null !== $existingUserId) {
            $user = $userRepository->find((int) $existingUserId);

            if (!$user instanceof User) {
                return $this->json([
                    'message' => 'Le compte associé à cette demande Google est introuvable.',
                ], 404);
            }
        }

        if (!$user instanceof User) {
            $user = new User();
            $user->setEmail((string) ($pendingGoogleAuth['providerEmail'] ?? ''));
            $user->setFirstName((string) ($pendingGoogleAuth['firstName'] ?? 'Utilisateur'));
            $user->setLastName((string) ($pendingGoogleAuth['lastName'] ?? 'Google'));
            $user->setRole(User::ROLE_CLIENT);
            $user->setCreatedAt($now);

            $randomPassword = bin2hex(random_bytes(32));
            $user->setPasswordHash($passwordHasher->hashPassword($user, $randomPassword));
        }

        $user->setTermsAcceptedAt($now);
        $user->setPrivacyAcceptedAt($now);

        if (
            null === $user->getProfilePhoto() &&
            isset($pendingGoogleAuth['profilePhoto']) &&
            is_string($pendingGoogleAuth['profilePhoto']) &&
            trim($pendingGoogleAuth['profilePhoto']) !== ''
        ) {
            $user->setProfilePhoto(trim($pendingGoogleAuth['profilePhoto']));
        }

        $providerUserId = (string) ($pendingGoogleAuth['providerUserId'] ?? '');
        $providerEmail = (string) ($pendingGoogleAuth['providerEmail'] ?? '');

        $oauthAccount = $oauthAccountRepository->findOneBy([
            'provider' => self::GOOGLE_PROVIDER,
            'providerUserId' => $providerUserId,
        ]);

        if (!$oauthAccount instanceof UserOauthAccount) {
            $oauthAccount = (new UserOauthAccount())
                ->setUser($user)
                ->setProvider(self::GOOGLE_PROVIDER)
                ->setProviderUserId($providerUserId)
                ->setProviderEmail($providerEmail)
                ->setCreatedAt($now)
            ;

            $user->addOauthAccount($oauthAccount);
            $entityManager->persist($oauthAccount);
        }

        if ($subscribeToNewsletter) {
            $this->upsertNewsletterSubscription(
                $user,
                $newsletterSubscriptionRepository,
                $entityManager,
                $now,
                'google',
            );
        }

        $entityManager->persist($user);
        $entityManager->flush();

        $session->remove(self::GOOGLE_PENDING_SESSION_KEY);
        if (!$user->canAuthenticate()) {
            return $this->json([
                'message' => 'Ce compte est désactivé ou bloqué. Contacte le support EventFlow.',
            ], 403);
        }

        $security->login($user);

        return $this->json([
            'message' => 'Compte Google finalise avec succès.',
            'newsletterSubscribed' => $this->hasActiveNewsletterSubscription($user),
            'user' => $this->serializeUser($user),
        ], 200);
    }

    #[Route('/api/password/forgot', name: 'api_password_forgot', methods: ['POST'])]
    public function forgotPassword(
        Request $request,
        UserRepository $userRepository,
        PasswordResetRequestRepository $passwordResetRequestRepository,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer,
        #[Autowire('%env(string:FRONTEND_APP_URL)%')]
        string $frontendAppUrl,
    ): JsonResponse {
        $data = $request->toArray();
        $email = trim((string) ($data['email'] ?? ''));

        if ('' === $email) {
            return $this->json([
                'message' => 'Merci de renseigner un email.',
            ], 400);
        }

        $response = [
            'message' => 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.',
        ];

        $user = $userRepository->findOneBy(['email' => $email]);

        if (!$user instanceof User) {
            return $this->json($response, 200);
        }

        $now = new \DateTimeImmutable();
        $passwordResetRequestRepository->markActiveRequestsAsUsedForUser($user, $now);

        $rawToken = bin2hex(random_bytes(32));
        $resetRequest = (new PasswordResetRequest())
            ->setUser($user)
            ->setTokenHash(hash('sha256', $rawToken))
            ->setRequestedAt($now)
            ->setExpiresAt($now->modify('+'.self::PASSWORD_RESET_TTL_IN_SECONDS.' seconds'))
        ;

        $resetUrl = $this->buildFrontendAuthUrl($frontendAppUrl, [
            'mode' => 'reset-password',
            'token' => $rawToken,
        ]);

        $entityManager->persist($resetRequest);
        $entityManager->flush();

        try {
            $mailer->send(
                (new Email())
                    ->from('no-reply@eventflow.local')
                    ->to($email)
                    ->subject('Réinitialisation de ton mot de passe EventFlow')
                    ->text(
                        "Bonjour,\n\n".
                        "Voici ton lien de réinitialisation EventFlow :\n".
                        $resetUrl."\n\n".
                        "Ce lien est valable pendant 1 heure.\n"
                    )
            );
        } catch (\Throwable $exception) {
            return $this->json([
                'message' => 'Impossible d’envoyer l’email de réinitialisation pour le moment.',
            ], 503);
        }

        return $this->json($response, 200);
    }

    #[Route('/api/me', name: 'api_me_update', methods: ['PATCH', 'POST'])]
    public function updateMe(
        Request $request,
        NewsletterSubscriptionRepository $newsletterSubscriptionRepository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], 401);
        }

        $data = $this->getRequestData($request);
        $profilePhotoFile = $request->files->get('profilePhotoFile');

        if (array_key_exists('firstName', $data)) {
            $firstName = trim((string) $data['firstName']);

            if ('' === $firstName) {
                return $this->json([
                    'message' => 'Le prénom ne peut pas être vide.',
                ], 400);
            }

            $user->setFirstName($firstName);
        }

        if (array_key_exists('lastName', $data)) {
            $lastName = trim((string) $data['lastName']);

            if ('' === $lastName) {
                return $this->json([
                    'message' => 'Le nom ne peut pas être vide.',
                ], 400);
            }

            $user->setLastName($lastName);
        }

        if ($profilePhotoFile instanceof UploadedFile) {
            try {
                $newProfilePhotoPath = $this->uploadProfileImage($profilePhotoFile);
                $this->removeUploadedProfilePhoto($user->getProfilePhoto());
                $user->setProfilePhoto($newProfilePhotoPath);
            } catch (\RuntimeException $exception) {
                return $this->json([
                    'message' => $exception->getMessage(),
                ], 400);
            }
        } elseif (
            array_key_exists('profilePhotoDataUrl', $data) &&
            is_string($data['profilePhotoDataUrl']) &&
            trim($data['profilePhotoDataUrl']) !== ''
        ) {
            try {
                $newProfilePhotoPath = $this->uploadProfileImageFromDataUrl((string) $data['profilePhotoDataUrl']);
                $this->removeUploadedProfilePhoto($user->getProfilePhoto());
                $user->setProfilePhoto($newProfilePhotoPath);
            } catch (\RuntimeException $exception) {
                return $this->json([
                    'message' => $exception->getMessage(),
                ], 400);
            }
        } elseif ($this->toBoolean($data['removeProfilePhoto'] ?? false)) {
            $this->removeUploadedProfilePhoto($user->getProfilePhoto());
            $user->setProfilePhoto(null);
        } elseif (array_key_exists('profilePhoto', $data)) {
            $profilePhoto = $this->normalizeNullableString($data['profilePhoto'] ?? null);

            if ($profilePhoto !== $user->getProfilePhoto()) {
                $this->removeUploadedProfilePhoto($user->getProfilePhoto());
            }

            $user->setProfilePhoto($profilePhoto);
        }

        if (array_key_exists('subscribeToNewsletter', $data)) {
            $this->syncNewsletterSubscriptionPreference(
                $user,
                $newsletterSubscriptionRepository,
                $entityManager,
                $this->toBoolean($data['subscribeToNewsletter']),
                new \DateTimeImmutable(),
                'profile',
            );
        }

        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json([
            'message' => 'Ton profil a été mis à jour.',
            'user' => $this->serializeUser($user),
        ], 200);
    }

    #[Route('/api/password/reset', name: 'api_password_reset', methods: ['POST'])]
    public function resetPassword(
        Request $request,
        PasswordResetRequestRepository $passwordResetRequestRepository,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
    ): JsonResponse {
        $data = $request->toArray();
        $rawToken = trim((string) ($data['token'] ?? ''));
        $newPassword = (string) ($data['password'] ?? '');

        if ('' === $rawToken || '' === trim($newPassword)) {
            return $this->json([
                'message' => 'Le token de réinitialisation et le nouveau mot de passa sont obligatoires.',
            ], 400);
        }

        $passwordValidationError = $this->validatePassword($newPassword);

        if (null !== $passwordValidationError) {
            return $this->json([
                'message' => $passwordValidationError,
            ], 400);
        }

        $resetRequest = $passwordResetRequestRepository->findActiveByToken(
            $rawToken,
            new \DateTimeImmutable(),
        );

        if (!$resetRequest instanceof PasswordResetRequest || !$resetRequest->getUser() instanceof User) {
            return $this->json([
                'message' => 'Le lien de réinitialisation est invalide ou expire.',
            ], 400);
        }

        $user = $resetRequest->getUser();
        $now = new \DateTimeImmutable();
        $passwordResetRequestRepository->markActiveRequestsAsUsedForUser($user, $now);
        $user->setPasswordHash($passwordHasher->hashPassword($user, $newPassword));
        $resetRequest->setUsedAt($now);

        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json([
            'message' => 'Ton mot de passe a été réinitialisé avec succès.',
        ], 200);
    }

    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], 401);
        }

        return $this->json($this->serializeUser($user));
    }

    private function upsertNewsletterSubscription(
        User $user,
        NewsletterSubscriptionRepository $newsletterSubscriptionRepository,
        EntityManagerInterface $entityManager,
        \DateTimeImmutable $now,
        string $source
    ): void {
        $email = $user->getEmail() ?? '';

        if ('' === $email) {
            return;
        }

        $newsletterSubscription = $newsletterSubscriptionRepository->findOneBy([
            'email' => $email,
        ]);

        if (!$newsletterSubscription instanceof NewsletterSubscription) {
            $newsletterSubscription = (new NewsletterSubscription())
                ->setEmail($email)
                ->setCreatedAt($now)
            ;
        }

        $newsletterSubscription
            ->setUser($user)
            ->setStatus(NewsletterSubscription::STATUS_SUBSCRIBED)
            ->setSource($source)
            ->setConsentedAt($now)
            ->setUnsubscribedAt(null)
            ->setUpdatedAt($now)
        ;

        $user->addNewsletterSubscription($newsletterSubscription);
        $entityManager->persist($newsletterSubscription);
    }

    private function syncNewsletterSubscriptionPreference(
        User $user,
        NewsletterSubscriptionRepository $newsletterSubscriptionRepository,
        EntityManagerInterface $entityManager,
        bool $shouldSubscribe,
        \DateTimeImmutable $now,
        string $source
    ): void {
        if ($shouldSubscribe) {
            $this->upsertNewsletterSubscription(
                $user,
                $newsletterSubscriptionRepository,
                $entityManager,
                $now,
                $source,
            );

            return;
        }

        $email = $user->getEmail() ?? '';

        if ('' === $email) {
            return;
        }

        $newsletterSubscription = $newsletterSubscriptionRepository->findOneBy([
            'email' => $email,
        ]);

        if (!$newsletterSubscription instanceof NewsletterSubscription) {
            return;
        }

        $newsletterSubscription
            ->setUser($user)
            ->setStatus(NewsletterSubscription::STATUS_UNSUBSCRIBED)
            ->setUnsubscribedAt($now)
            ->setUpdatedAt($now)
        ;

        $entityManager->persist($newsletterSubscription);
    }

    /**
     * @return array{
     *   id: int|null,
     *   email: string|null,
     *   role: string|null,
     *   baseRole: string|null,
     *   roles: list<string>,
     *   firstName: string|null,
     *   lastName: string|null,
     *   profilePhoto: string|null,
     *   termsAcceptedAt: string|null,
     *   privacyAcceptedAt: string|null,
     *   newsletterSubscribed: bool,
     *   canManageStaff: bool,
     *   canAccessStaffTools: bool,
     *   managedStaffCount: int,
     *   staffOrganizerCount: int
     * }
     */
    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'role' => $user->getEffectiveRole(),
            'baseRole' => $user->getBaseRole(),
            'accountStatus' => $user->getAccountStatus(),
            'roles' => array_values(array_filter(
                $user->getRoles(),
                static fn (string $role): bool => 'ROLE_USER' !== $role,
            )),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'profilePhoto' => $user->getProfilePhoto(),
            'termsAcceptedAt' => $user->getTermsAcceptedAt()?->format(DATE_ATOM),
            'privacyAcceptedAt' => $user->getPrivacyAcceptedAt()?->format(DATE_ATOM),
            'newsletterSubscribed' => $this->hasActiveNewsletterSubscription($user),
            'canManageStaff' => $user->canManageStaff(),
            'canAccessStaffTools' => $user->canAccessStaffTools(),
            'managedStaffCount' => $user->countActiveManagedStaffMembers(),
            'staffOrganizerCount' => $user->countActiveStaffMemberships(),
        ];
    }

    private function hasActiveNewsletterSubscription(User $user): bool
    {
        foreach ($user->getNewsletterSubscriptions() as $newsletterSubscription) {
            if (
                $newsletterSubscription->getStatus() === NewsletterSubscription::STATUS_SUBSCRIBED &&
                null === $newsletterSubscription->getUnsubscribedAt()
            ) {
                return true;
            }
        }

        return false;
    }

    private function getRequestData(Request $request): array
    {
        $contentType = (string) $request->headers->get('Content-Type', '');

        if (str_contains($contentType, 'application/json')) {
            try {
                return $request->toArray();
            } catch (\Throwable) {
                return [];
            }
        }

        return $request->request->all();
    }

    private function uploadProfileImage(UploadedFile $file): string
    {
        return $this->imageStorage->storeUploadedImage($file, 'profiles', 'profile');

        $mimeType = $file->getMimeType() ?? '';

        if (!str_starts_with($mimeType, 'image/')) {
            throw new \RuntimeException('Le fichier envoyé doit être une image.');
        }

        $uploadDir = $this->getParameter('kernel.project_dir').'/public/uploads/profiles';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = preg_replace('/[^A-Za-z0-9_-]/', '-', $originalName) ?: 'profile';
        $extension = $file->guessExtension() ?: 'bin';
        $filename = uniqid('profile_', true).'-'.$safeName.'.'.$extension;

        $file->move($uploadDir, $filename);

        return '/uploads/profiles/'.$filename;
    }

    private function uploadProfileImageFromDataUrl(string $dataUrl): string
    {
        return $this->imageStorage->storeDataUrlImage($dataUrl, 'profiles', 'profile');

        if (!preg_match('/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/', $dataUrl, $matches)) {
            throw new \RuntimeException('Le format de la photo de profil est invalide.');
        }

        $mimeType = strtolower((string) ($matches[1] ?? ''));

        if (!str_starts_with($mimeType, 'image/')) {
            throw new \RuntimeException('La photo de profil doit être une image.');
        }

        $rawData = base64_decode((string) ($matches[2] ?? ''), true);

        if (false === $rawData || '' === $rawData) {
            throw new \RuntimeException('Impossible de décoder la photo de profil.');
        }

        $uploadDir = $this->getParameter('kernel.project_dir').'/public/uploads/profiles';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $extension = match ($mimeType) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'bin',
        };

        $filename = uniqid('profile_', true).'-upload.'.$extension;
        $targetPath = $uploadDir.'/'.$filename;

        if (false === file_put_contents($targetPath, $rawData)) {
            throw new \RuntimeException('Impossible d’enregistrer la photo de profil.');
        }

        return '/uploads/profiles/'.$filename;
    }

    private function removeUploadedProfilePhoto(?string $storedPath): void
    {
        $this->imageStorage->remove($storedPath);

        return;

        if (!is_string($storedPath) || !str_starts_with($storedPath, '/uploads/profiles/')) {
            return;
        }

        $fullPath = $this->getParameter('kernel.project_dir').'/public'.$storedPath;

        if (is_file($fullPath)) {
            unlink($fullPath);
        }
    }

    private function redirectBlockedAccount(string $frontendAppUrl, string $intent): RedirectResponse
    {
        return $this->redirect(
            $this->buildFrontendAuthUrl($frontendAppUrl, [
                'mode' => 'login',
                'intent' => $intent,
                'google' => 'account_blocked',
            ])
        );
    }

    private function resolveFirstName(array $googleUserInfo): string
    {
        return $this->normalizeNullableString($googleUserInfo['given_name'] ?? null)
            ?? $this->normalizeNullableString($googleUserInfo['name'] ?? null)
            ?? 'Utilisateur';
    }

    private function resolveLastName(array $googleUserInfo): string
    {
        return $this->normalizeNullableString($googleUserInfo['family_name'] ?? null) ?? 'Google';
    }

    private function buildFrontendAuthUrl(string $frontendAppUrl, array $params = []): string
    {
        $frontendAuthUrl = rtrim($frontendAppUrl, '/').'/auth';
        $query = array_filter(
            $params,
            static fn (mixed $value): bool => is_string($value) && trim($value) !== ''
        );

        if ([] === $query) {
            return $frontendAuthUrl;
        }

        return $frontendAuthUrl.'?'.http_build_query($query);
    }

    private function sanitizeIntent(string $intent): string
    {
        $intent = strtolower(trim($intent));

        return in_array($intent, ['organizer', 'publish'], true) ? $intent : '';
    }

    private function sanitizeMode(string $mode): string
    {
        $mode = strtolower(trim($mode));

        return in_array($mode, ['login', 'register'], true) ? $mode : 'login';
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' !== $value ? $value : null;
    }

    private function toBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value)) {
            return 1 === $value;
        }

        if (is_string($value)) {
            return in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'on'], true);
        }

        return false;
    }

    private function validatePassword(string $password): ?string
    {
        $password = trim($password);

        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/', $password)) {
            return self::PASSWORD_REQUIREMENTS_MESSAGE;
        }

        return null;
    }
}
