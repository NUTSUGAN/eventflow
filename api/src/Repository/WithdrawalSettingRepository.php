<?php

namespace App\Repository;

use App\Entity\WithdrawalSetting;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<WithdrawalSetting>
 */
class WithdrawalSettingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, WithdrawalSetting::class);
    }

    public function getCurrent(EntityManagerInterface $entityManager): WithdrawalSetting
    {
        $setting = $this->findOneBy([], ['id' => 'ASC']);

        if ($setting instanceof WithdrawalSetting) {
            return $setting;
        }

        $setting = new WithdrawalSetting();
        $entityManager->persist($setting);
        $entityManager->flush();

        return $setting;
    }
}
