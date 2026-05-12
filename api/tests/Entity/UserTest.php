<?php

namespace App\Tests\Entity;

use App\Entity\NewsletterSubscription;
use App\Entity\User;
use App\Entity\UserOauthAccount;
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    public function testUserIdentifierUsesEmail(): void
    {
        $user = (new User())->setEmail('client@eventflow.test');

        self::assertSame('client@eventflow.test', $user->getUserIdentifier());
    }

    public function testRoleIsNormalizedForSymfonySecurity(): void
    {
        $user = (new User())->setRole('client');

        self::assertSame('ROLE_CLIENT', $user->getRole());
        self::assertSame(['ROLE_CLIENT', 'ROLE_USER'], $user->getRoles());
    }

    public function testProfilePhotoCanBeStored(): void
    {
        $user = (new User())->setProfilePhoto('/uploads/users/organizer.png');

        self::assertSame('/uploads/users/organizer.png', $user->getProfilePhoto());
    }

    public function testPolicyConsentTimestampsCanBeStored(): void
    {
        $acceptedAt = new \DateTimeImmutable('2026-05-02 10:00:00');
        $user = (new User())
            ->setTermsAcceptedAt($acceptedAt)
            ->setPrivacyAcceptedAt($acceptedAt);

        self::assertSame($acceptedAt, $user->getTermsAcceptedAt());
        self::assertSame($acceptedAt, $user->getPrivacyAcceptedAt());
    }

    public function testOauthAccountsAndNewsletterSubscriptionsAreLinkedToUser(): void
    {
        $user = new User();
        $oauthAccount = (new UserOauthAccount())
            ->setProvider('google')
            ->setProviderUserId('google-user-123');
        $newsletterSubscription = (new NewsletterSubscription())
            ->setEmail('client@eventflow.test')
            ->setStatus(NewsletterSubscription::STATUS_SUBSCRIBED)
            ->setSource(NewsletterSubscription::SOURCE_REGISTER)
            ->setConsentedAt(new \DateTimeImmutable('2026-05-02 10:05:00'))
            ->setCreatedAt(new \DateTimeImmutable('2026-05-02 10:05:00'))
            ->setUpdatedAt(new \DateTimeImmutable('2026-05-02 10:05:00'));

        $user->addOauthAccount($oauthAccount);
        $user->addNewsletterSubscription($newsletterSubscription);

        self::assertCount(1, $user->getOauthAccounts());
        self::assertSame($user, $oauthAccount->getUser());
        self::assertCount(1, $user->getNewsletterSubscriptions());
        self::assertSame($user, $newsletterSubscription->getUser());
    }

    public function testKnownApplicationRolesAreAvailable(): void
    {
        self::assertSame('ROLE_CLIENT', User::ROLE_CLIENT);
        self::assertSame('ROLE_ORGANIZER', User::ROLE_ORGANIZER);
        self::assertSame('ROLE_STAFF', User::ROLE_STAFF);
        self::assertSame('ROLE_ADMIN', User::ROLE_ADMIN);
    }
}
