<?php

namespace App\Tests\Service;

use App\Entity\User;
use App\Repository\OrganizerStaffMemberRepository;
use App\Repository\UserRepository;
use App\Service\OrganizerStaffService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\MailerInterface;

class OrganizerStaffServiceTest extends TestCase
{
    private OrganizerStaffMemberRepository&MockObject $organizerStaffMemberRepository;
    private UserRepository&MockObject $userRepository;
    private EntityManagerInterface&MockObject $entityManager;
    private MailerInterface&MockObject $mailer;
    private LoggerInterface&MockObject $logger;
    private OrganizerStaffService $service;

    protected function setUp(): void
    {
        $this->organizerStaffMemberRepository = $this->createMock(OrganizerStaffMemberRepository::class);
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->mailer = $this->createMock(MailerInterface::class);
        $this->logger = $this->createMock(LoggerInterface::class);

        $this->service = new OrganizerStaffService(
            $this->organizerStaffMemberRepository,
            $this->userRepository,
            $this->entityManager,
            $this->mailer,
            $this->logger,
        );
    }

    public function testCannotAddAdminToStaff(): void
    {
        $organizer = (new User())
            ->setRole(User::ROLE_ORGANIZER)
            ->setEmail('organizer@eventflow.test');
        $this->setUserId($organizer, 100);

        $staffUser = (new User())
            ->setRole(User::ROLE_ADMIN)
            ->setEmail('admin@eventflow.test');
        $this->setUserId($staffUser, 200);

        $this->userRepository
            ->expects(self::once())
            ->method('findOneByEmailInsensitive')
            ->with('admin@eventflow.test')
            ->willReturn($staffUser);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Tu ne peux pas ajouter un administrateur dans ton staff.');

        $this->service->addMemberByEmail($organizer, 'admin@eventflow.test');
    }

    public function testCannotAddAnotherOrganizerToStaff(): void
    {
        $organizer = (new User())
            ->setRole(User::ROLE_ORGANIZER)
            ->setEmail('organizer@eventflow.test');
        $this->setUserId($organizer, 100);

        $staffUser = (new User())
            ->setRole(User::ROLE_ORGANIZER)
            ->setEmail('other-organizer@eventflow.test');
        $this->setUserId($staffUser, 201);

        $this->userRepository
            ->expects(self::once())
            ->method('findOneByEmailInsensitive')
            ->with('other-organizer@eventflow.test')
            ->willReturn($staffUser);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Tu ne peux pas ajouter un autre organisateur dans ton staff.');

        $this->service->addMemberByEmail($organizer, 'other-organizer@eventflow.test');
    }

    private function setUserId(User $user, int $id): void
    {
        $reflectionProperty = new \ReflectionProperty(User::class, 'id');
        $reflectionProperty->setValue($user, $id);
    }
}
