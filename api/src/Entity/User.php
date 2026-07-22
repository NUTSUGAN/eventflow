<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    public const ROLE_CLIENT = 'ROLE_CLIENT';
    public const ROLE_ORGANIZER = 'ROLE_ORGANIZER';
    public const ROLE_STAFF = 'ROLE_STAFF';
    public const ROLE_ADMIN = 'ROLE_ADMIN';
    public const ROLE_ADMIN_SUPPORT = 'ROLE_ADMIN_SUPPORT';
    public const ROLE_ADMIN_FINANCE = 'ROLE_ADMIN_FINANCE';

    public const ADMIN_ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_ADMIN_SUPPORT,
        self::ROLE_ADMIN_FINANCE,
    ];

    public const ACCOUNT_STATUS_ACTIVE = 'active';
    public const ACCOUNT_STATUS_DISABLED = 'disabled';
    public const ACCOUNT_STATUS_BLOCKED = 'blocked';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_user')]
    private ?int $id = null;

    #[ORM\Column(name: 'first_name', length: 80)]
    private ?string $firstName = null;

    #[ORM\Column(name: 'last_name', length: 80)]
    private ?string $lastName = null;

    #[ORM\Column(name: 'email', length: 180, unique: true)]
    private ?string $email = null;

    #[ORM\Column(name: 'password_hash', length: 255)]
    private ?string $passwordHash = null;

    #[ORM\Column(name: 'role', length: 20)]
    private ?string $role = self::ROLE_CLIENT;

    #[ORM\Column(name: 'account_status', length: 20, options: ['default' => self::ACCOUNT_STATUS_ACTIVE])]
    private ?string $accountStatus = self::ACCOUNT_STATUS_ACTIVE;

    #[ORM\Column(name: 'failed_login_attempts', options: ['default' => 0])]
    private int $failedLoginAttempts = 0;

    #[ORM\Column(name: 'last_failed_login_at', nullable: true)]
    private ?\DateTimeImmutable $lastFailedLoginAt = null;

    #[ORM\Column(name: 'profile_photo', length: 255, nullable: true)]
    private ?string $profilePhoto = null;

    #[ORM\Column(name: 'terms_accepted_at', nullable: true)]
    private ?\DateTimeImmutable $termsAcceptedAt = null;

    #[ORM\Column(name: 'privacy_accepted_at', nullable: true)]
    private ?\DateTimeImmutable $privacyAcceptedAt = null;

    #[ORM\Column(name: 'created_at')]
    private ?\DateTimeImmutable $createdAt = null;

    /**
     * @var Collection<int, Event>
     */
    #[ORM\OneToMany(targetEntity: Event::class, mappedBy: 'organizer')]
    private Collection $organizedEvents;

    /**
     * @var Collection<int, PromotionCampaign>
     */
    #[ORM\OneToMany(targetEntity: PromotionCampaign::class, mappedBy: 'organizer')]
    private Collection $promotionCampaigns;

    /**
     * @var Collection<int, AbonnementOrganisateur>
     */
    #[ORM\OneToMany(targetEntity: AbonnementOrganisateur::class, mappedBy: 'client')]
    private Collection $clientSubscriptions;

    /**
     * @var Collection<int, AbonnementOrganisateur>
     */
    #[ORM\OneToMany(targetEntity: AbonnementOrganisateur::class, mappedBy: 'organizer')]
    private Collection $organizerSubscriptions;

    /**
     * @var Collection<int, Order>
     */
    #[ORM\OneToMany(targetEntity: Order::class, mappedBy: 'client')]
    private Collection $clientOrders;

    /**
     * @var Collection<int, Checkin>
     */
    #[ORM\OneToMany(targetEntity: Checkin::class, mappedBy: 'staffUser')]
    private Collection $staffCheckins;

    /**
     * @var Collection<int, OrganizerStaffMember>
     */
    #[ORM\OneToMany(targetEntity: OrganizerStaffMember::class, mappedBy: 'organizer', orphanRemoval: true)]
    private Collection $managedStaffMembers;

    /**
     * @var Collection<int, OrganizerStaffMember>
     */
    #[ORM\OneToMany(targetEntity: OrganizerStaffMember::class, mappedBy: 'staffUser', orphanRemoval: true)]
    private Collection $staffMemberships;

    /**
     * @var Collection<int, UserOauthAccount>
     */
    #[ORM\OneToMany(
        targetEntity: UserOauthAccount::class,
        mappedBy: 'user',
        orphanRemoval: true,
        cascade: ['persist']
    )]
    private Collection $oauthAccounts;

    /**
     * @var Collection<int, NewsletterSubscription>
     */
    #[ORM\OneToMany(
        targetEntity: NewsletterSubscription::class,
        mappedBy: 'user',
        orphanRemoval: true,
        cascade: ['persist']
    )]
    private Collection $newsletterSubscriptions;

    #[ORM\OneToOne(mappedBy: 'user', targetEntity: OrganizerApplication::class, cascade: ['persist', 'remove'])]
    private ?OrganizerApplication $organizerApplication = null;

    public function __construct()
    {
        $this->organizedEvents = new ArrayCollection();
        $this->promotionCampaigns = new ArrayCollection();
        $this->clientSubscriptions = new ArrayCollection();
        $this->organizerSubscriptions = new ArrayCollection();
        $this->clientOrders = new ArrayCollection();
        $this->staffCheckins = new ArrayCollection();
        $this->managedStaffMembers = new ArrayCollection();
        $this->staffMemberships = new ArrayCollection();
        $this->oauthAccounts = new ArrayCollection();
        $this->newsletterSubscriptions = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }

    public function getDisplayName(): string
    {
        $fullName = trim(sprintf(
            '%s %s',
            (string) ($this->firstName ?? ''),
            (string) ($this->lastName ?? ''),
        ));

        return '' !== $fullName ? $fullName : (string) ($this->email ?? 'Utilisateur EventFlow');
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getPasswordHash(): ?string
    {
        return $this->passwordHash;
    }

    public function setPasswordHash(string $passwordHash): static
    {
        $this->passwordHash = $passwordHash;

        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->passwordHash;
    }

    public function getRole(): ?string
    {
        return $this->role;
    }

    public function getBaseRole(): string
    {
        return $this->role ? $this->normalizeRole($this->role) : self::ROLE_CLIENT;
    }

    public function setRole(string $role): static
    {
        $this->role = $this->normalizeRole($role);

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getRoles(): array
    {
        $baseRole = $this->getBaseRole();
        $roles = [$baseRole];

        if (self::ROLE_ADMIN === $baseRole) {
            $roles[] = self::ROLE_ADMIN_SUPPORT;
            $roles[] = self::ROLE_ADMIN_FINANCE;
        }

        if ($this->hasActiveStaffMembership() && !in_array($baseRole, [self::ROLE_ORGANIZER, ...self::ADMIN_ROLES], true)) {
            array_unshift($roles, self::ROLE_STAFF);
        } elseif ($this->hasActiveStaffMembership()) {
            $roles[] = self::ROLE_STAFF;
        }

        $roles[] = 'ROLE_USER';

        return array_values(array_unique($roles));
    }

    public function getEffectiveRole(): string
    {
        $roles = array_values(array_filter(
            $this->getRoles(),
            static fn (string $role): bool => 'ROLE_USER' !== $role,
        ));

        return $roles[0] ?? self::ROLE_CLIENT;
    }

    public function isOrganizerOrAdmin(): bool
    {
        return in_array(
            $this->getBaseRole(),
            [self::ROLE_ORGANIZER, ...self::ADMIN_ROLES],
            true,
        );
    }

    public static function isAdminRole(?string $role): bool
    {
        return is_string($role) && in_array($role, self::ADMIN_ROLES, true);
    }

    public function isAdminAccount(): bool
    {
        return self::isAdminRole($this->getBaseRole());
    }

    public function isSuperAdminAccount(): bool
    {
        return self::ROLE_ADMIN === $this->getBaseRole();
    }

    public function canManageStaff(): bool
    {
        return $this->isOrganizerOrAdmin();
    }

    public function canAccessStaffTools(): bool
    {
        return $this->canManageStaff() || $this->hasActiveStaffMembership();
    }

    public function hasActiveStaffMembership(): bool
    {
        foreach ($this->staffMemberships as $staffMembership) {
            if ($staffMembership->isActive()) {
                return true;
            }
        }

        return false;
    }

    public function countActiveManagedStaffMembers(): int
    {
        $count = 0;

        foreach ($this->managedStaffMembers as $managedStaffMember) {
            if ($managedStaffMember->isActive()) {
                ++$count;
            }
        }

        return $count;
    }

    public function countActiveStaffMemberships(): int
    {
        $count = 0;

        foreach ($this->staffMemberships as $staffMembership) {
            if ($staffMembership->isActive()) {
                ++$count;
            }
        }

        return $count;
    }

    public function getProfilePhoto(): ?string
    {
        return $this->profilePhoto;
    }

    public function setProfilePhoto(?string $profilePhoto): static
    {
        $this->profilePhoto = $profilePhoto;

        return $this;
    }

    public function getTermsAcceptedAt(): ?\DateTimeImmutable
    {
        return $this->termsAcceptedAt;
    }

    public function setTermsAcceptedAt(?\DateTimeImmutable $termsAcceptedAt): static
    {
        $this->termsAcceptedAt = $termsAcceptedAt;

        return $this;
    }

    public function getPrivacyAcceptedAt(): ?\DateTimeImmutable
    {
        return $this->privacyAcceptedAt;
    }

    public function setPrivacyAcceptedAt(?\DateTimeImmutable $privacyAcceptedAt): static
    {
        $this->privacyAcceptedAt = $privacyAcceptedAt;

        return $this;
    }

    public function eraseCredentials(): void
    {
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    /**
     * @return Collection<int, Event>
     */
    public function getOrganizedEvents(): Collection
    {
        return $this->organizedEvents;
    }

    public function addOrganizedEvent(Event $organizedEvent): static
    {
        if (!$this->organizedEvents->contains($organizedEvent)) {
            $this->organizedEvents->add($organizedEvent);
            $organizedEvent->setOrganizer($this);
        }

        return $this;
    }

    public function removeOrganizedEvent(Event $organizedEvent): static
    {
        if ($this->organizedEvents->removeElement($organizedEvent)) {
            // set the owning side to null (unless already changed)
            if ($organizedEvent->getOrganizer() === $this) {
                $organizedEvent->setOrganizer(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, PromotionCampaign>
     */
    public function getPromotionCampaigns(): Collection
    {
        return $this->promotionCampaigns;
    }

    public function addPromotionCampaign(PromotionCampaign $promotionCampaign): static
    {
        if (!$this->promotionCampaigns->contains($promotionCampaign)) {
            $this->promotionCampaigns->add($promotionCampaign);
            $promotionCampaign->setOrganizer($this);
        }

        return $this;
    }

    public function removePromotionCampaign(PromotionCampaign $promotionCampaign): static
    {
        if (
            $this->promotionCampaigns->removeElement($promotionCampaign)
            && $promotionCampaign->getOrganizer() === $this
        ) {
            $promotionCampaign->setOrganizer(null);
        }

        return $this;
    }

    /**
     * @return Collection<int, AbonnementOrganisateur>
     */
    public function getClientSubscriptions(): Collection
    {
        return $this->clientSubscriptions;
    }

    public function addClientSubscription(AbonnementOrganisateur $clientSubscription): static
    {
        if (!$this->clientSubscriptions->contains($clientSubscription)) {
            $this->clientSubscriptions->add($clientSubscription);
            $clientSubscription->setClient($this);
        }

        return $this;
    }

    public function removeClientSubscription(AbonnementOrganisateur $clientSubscription): static
    {
        if ($this->clientSubscriptions->removeElement($clientSubscription)) {
            // set the owning side to null (unless already changed)
            if ($clientSubscription->getClient() === $this) {
                $clientSubscription->setClient(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, AbonnementOrganisateur>
     */
    public function getOrganizerSubscriptions(): Collection
    {
        return $this->organizerSubscriptions;
    }

    public function addOrganizerSubscription(AbonnementOrganisateur $organizerSubscription): static
    {
        if (!$this->organizerSubscriptions->contains($organizerSubscription)) {
            $this->organizerSubscriptions->add($organizerSubscription);
            $organizerSubscription->setOrganizer($this);
        }

        return $this;
    }

    public function removeOrganizerSubscription(AbonnementOrganisateur $organizerSubscription): static
    {
        if ($this->organizerSubscriptions->removeElement($organizerSubscription)) {
            // set the owning side to null (unless already changed)
            if ($organizerSubscription->getOrganizer() === $this) {
                $organizerSubscription->setOrganizer(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Order>
     */
    public function getClientOrders(): Collection
    {
        return $this->clientOrders;
    }

    public function addClientOrder(Order $clientOrder): static
    {
        if (!$this->clientOrders->contains($clientOrder)) {
            $this->clientOrders->add($clientOrder);
            $clientOrder->setClient($this);
        }

        return $this;
    }

    public function removeClientOrder(Order $clientOrder): static
    {
        if ($this->clientOrders->removeElement($clientOrder)) {
            // set the owning side to null (unless already changed)
            if ($clientOrder->getClient() === $this) {
                $clientOrder->setClient(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Checkin>
     */
    public function getStaffCheckins(): Collection
    {
        return $this->staffCheckins;
    }

    public function addStaffCheckin(Checkin $staffCheckin): static
    {
        if (!$this->staffCheckins->contains($staffCheckin)) {
            $this->staffCheckins->add($staffCheckin);
            $staffCheckin->setStaffUser($this);
        }

        return $this;
    }

    public function getAccountStatus(): string
    {
        return $this->accountStatus
            ? $this->normalizeAccountStatus($this->accountStatus)
            : self::ACCOUNT_STATUS_ACTIVE;
    }

    public function setAccountStatus(string $accountStatus): static
    {
        $this->accountStatus = $this->normalizeAccountStatus($accountStatus);

        return $this;
    }

    public function canAuthenticate(): bool
    {
        return self::ACCOUNT_STATUS_ACTIVE === $this->getAccountStatus();
    }

    public function getFailedLoginAttempts(): int
    {
        return max(0, $this->failedLoginAttempts);
    }

    public function setFailedLoginAttempts(int $failedLoginAttempts): static
    {
        $this->failedLoginAttempts = max(0, $failedLoginAttempts);

        return $this;
    }

    public function incrementFailedLoginAttempts(?\DateTimeImmutable $failedAt = null): int
    {
        ++$this->failedLoginAttempts;
        $this->lastFailedLoginAt = $failedAt ?? new \DateTimeImmutable();

        return $this->getFailedLoginAttempts();
    }

    public function resetFailedLoginAttempts(): static
    {
        $this->failedLoginAttempts = 0;
        $this->lastFailedLoginAt = null;

        return $this;
    }

    public function getLastFailedLoginAt(): ?\DateTimeImmutable
    {
        return $this->lastFailedLoginAt;
    }

    /**
     * @return Collection<int, OrganizerStaffMember>
     */
    public function getManagedStaffMembers(): Collection
    {
        return $this->managedStaffMembers;
    }

    public function addManagedStaffMember(OrganizerStaffMember $managedStaffMember): static
    {
        if (!$this->managedStaffMembers->contains($managedStaffMember)) {
            $this->managedStaffMembers->add($managedStaffMember);
            $managedStaffMember->setOrganizer($this);
        }

        return $this;
    }

    public function removeManagedStaffMember(OrganizerStaffMember $managedStaffMember): static
    {
        if ($this->managedStaffMembers->removeElement($managedStaffMember)) {
            if ($managedStaffMember->getOrganizer() === $this) {
                $managedStaffMember->setOrganizer(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, OrganizerStaffMember>
     */
    public function getStaffMemberships(): Collection
    {
        return $this->staffMemberships;
    }

    public function addStaffMembership(OrganizerStaffMember $staffMembership): static
    {
        if (!$this->staffMemberships->contains($staffMembership)) {
            $this->staffMemberships->add($staffMembership);
            $staffMembership->setStaffUser($this);
        }

        return $this;
    }

    public function removeStaffMembership(OrganizerStaffMember $staffMembership): static
    {
        if ($this->staffMemberships->removeElement($staffMembership)) {
            if ($staffMembership->getStaffUser() === $this) {
                $staffMembership->setStaffUser(null);
            }
        }

        return $this;
    }

    public function removeStaffCheckin(Checkin $staffCheckin): static
    {
        if ($this->staffCheckins->removeElement($staffCheckin)) {
            // set the owning side to null (unless already changed)
            if ($staffCheckin->getStaffUser() === $this) {
                $staffCheckin->setStaffUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, UserOauthAccount>
     */
    public function getOauthAccounts(): Collection
    {
        return $this->oauthAccounts;
    }

    public function addOauthAccount(UserOauthAccount $oauthAccount): static
    {
        if (!$this->oauthAccounts->contains($oauthAccount)) {
            $this->oauthAccounts->add($oauthAccount);
            $oauthAccount->setUser($this);
        }

        return $this;
    }

    public function removeOauthAccount(UserOauthAccount $oauthAccount): static
    {
        if ($this->oauthAccounts->removeElement($oauthAccount)) {
            if ($oauthAccount->getUser() === $this) {
                $oauthAccount->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, NewsletterSubscription>
     */
    public function getNewsletterSubscriptions(): Collection
    {
        return $this->newsletterSubscriptions;
    }

    public function addNewsletterSubscription(NewsletterSubscription $newsletterSubscription): static
    {
        if (!$this->newsletterSubscriptions->contains($newsletterSubscription)) {
            $this->newsletterSubscriptions->add($newsletterSubscription);
            $newsletterSubscription->setUser($this);
        }

        return $this;
    }

    public function getOrganizerApplication(): ?OrganizerApplication
    {
        return $this->organizerApplication;
    }

    public function setOrganizerApplication(?OrganizerApplication $organizerApplication): static
    {
        if (null === $organizerApplication) {
            if ($this->organizerApplication instanceof OrganizerApplication) {
                $this->organizerApplication->setUser(null);
            }

            $this->organizerApplication = null;

            return $this;
        }

        if ($organizerApplication->getUser() !== $this) {
            $organizerApplication->setUser($this);
        }

        $this->organizerApplication = $organizerApplication;

        return $this;
    }

    public function removeNewsletterSubscription(NewsletterSubscription $newsletterSubscription): static
    {
        if ($this->newsletterSubscriptions->removeElement($newsletterSubscription)) {
            if ($newsletterSubscription->getUser() === $this) {
                $newsletterSubscription->setUser(null);
            }
        }

        return $this;
    }

    private function normalizeRole(string $role): string
    {
        $role = strtoupper(trim($role));

        if (!str_starts_with($role, 'ROLE_')) {
            $role = 'ROLE_'.$role;
        }

        if ('ROLE_USER' === $role) {
            return self::ROLE_CLIENT;
        }

        return in_array($role, [
            self::ROLE_CLIENT,
            self::ROLE_ORGANIZER,
            self::ROLE_STAFF,
            self::ROLE_ADMIN,
            self::ROLE_ADMIN_SUPPORT,
            self::ROLE_ADMIN_FINANCE,
        ], true) ? $role : self::ROLE_CLIENT;
    }

    private function normalizeAccountStatus(string $accountStatus): string
    {
        $accountStatus = strtolower(trim($accountStatus));

        return in_array($accountStatus, [
            self::ACCOUNT_STATUS_ACTIVE,
            self::ACCOUNT_STATUS_DISABLED,
            self::ACCOUNT_STATUS_BLOCKED,
        ], true) ? $accountStatus : self::ACCOUNT_STATUS_ACTIVE;
    }
}
