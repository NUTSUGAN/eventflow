<?php

namespace App\Service;

use App\Entity\Event;
use App\Entity\OrganizerPayoutAccount;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\User;
use App\Entity\WithdrawalRequest;
use App\Repository\OrganizerPayoutAccountRepository;
use App\Repository\WithdrawalRequestRepository;
use Doctrine\ORM\EntityManagerInterface;

final class WithdrawalService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly WithdrawalRequestRepository $withdrawalRequestRepository,
        private readonly OrganizerPayoutAccountRepository $payoutAccountRepository,
    ) {
    }

    /**
     * @return array{grossAmount: string, feePercent: string, feeAmount: string, netAmount: string, currency: string, paidOrders: int, ticketsSold: int}
     */
    public function calculateEventAmounts(Event $event, ?string $feePercent = null): array
    {
        $row = $this->entityManager->createQueryBuilder()
            ->select('COUNT(DISTINCT customerOrder.id) AS paidOrders')
            ->addSelect('COALESCE(SUM(orderItem.quantity), 0) AS ticketsSold')
            ->addSelect('COALESCE(SUM(orderItem.quantity * orderItem.unitPriceAtPurchase), 0) AS grossAmount')
            ->from(OrderItem::class, 'orderItem')
            ->innerJoin('orderItem.customerOrder', 'customerOrder')
            ->innerJoin('orderItem.ticketType', 'ticketType')
            ->andWhere('ticketType.event = :event')
            ->andWhere('customerOrder.status = :paidStatus')
            ->andWhere('customerOrder.orderType = :ticketOrderType')
            ->setParameter('event', $event)
            ->setParameter('paidStatus', Order::STATUS_PAID)
            ->setParameter('ticketOrderType', Order::TYPE_TICKET)
            ->getQuery()
            ->getSingleResult()
        ;

        $grossAmount = (float) ($row['grossAmount'] ?? 0);
        $normalizedFeePercent = (float) ($feePercent ?? $event->getWithdrawalFeePercent());
        $feeAmount = round($grossAmount * ($normalizedFeePercent / 100), 2);
        $netAmount = max(0, round($grossAmount - $feeAmount, 2));

        return [
            'grossAmount' => number_format($grossAmount, 2, '.', ''),
            'feePercent' => number_format($normalizedFeePercent, 2, '.', ''),
            'feeAmount' => number_format($feeAmount, 2, '.', ''),
            'netAmount' => number_format($netAmount, 2, '.', ''),
            'currency' => Order::DEFAULT_CURRENCY,
            'paidOrders' => (int) ($row['paidOrders'] ?? 0),
            'ticketsSold' => (int) ($row['ticketsSold'] ?? 0),
        ];
    }

    public function isEventFinished(Event $event): bool
    {
        $referenceDate = $event->getEndDatetime();

        return $referenceDate instanceof \DateTimeImmutable
            && $referenceDate < new \DateTimeImmutable();
    }

    public function createRequest(Event $event, User $organizer): WithdrawalRequest
    {
        if ($event->getOrganizer()?->getId() !== $organizer->getId()) {
            throw new \DomainException('Tu ne peux demander un retrait que pour tes propres évènements.');
        }

        if (!$this->isEventFinished($event)) {
            throw new \DomainException('Le retrait sera disponible après la fin de l’évènement.');
        }

        if ($this->withdrawalRequestRepository->hasBlockingRequestForEvent($event)) {
            throw new \DomainException('Une demande de retrait existe déjà pour cet évènement.');
        }

        $payoutAccount = $this->payoutAccountRepository->findActiveForOrganizer($organizer);

        if (!$payoutAccount instanceof OrganizerPayoutAccount) {
            throw new \DomainException('Ajoute ton moyen de retrait avant de demander un retrait.');
        }

        $amounts = $this->calculateEventAmounts($event);

        if ((float) $amounts['grossAmount'] <= 0) {
            throw new \DomainException('Aucune vente payée ne permet de demander un retrait.');
        }

        $withdrawal = (new WithdrawalRequest())
            ->setEvent($event)
            ->setOrganizer($organizer)
            ->setGrossAmount($amounts['grossAmount'])
            ->setFeePercent($amounts['feePercent'])
            ->setFeeAmount($amounts['feeAmount'])
            ->setNetAmount($amounts['netAmount'])
            ->setCurrency($amounts['currency'])
            ->copyPayoutAccount($payoutAccount)
        ;

        $this->entityManager->persist($withdrawal);
        $this->entityManager->flush();

        return $withdrawal;
    }

    public function refreshAmounts(WithdrawalRequest $withdrawal, ?string $feePercent = null): void
    {
        $event = $withdrawal->getEvent();

        if (!$event instanceof Event) {
            throw new \DomainException('Évènement introuvable pour ce retrait.');
        }

        $amounts = $this->calculateEventAmounts($event, $feePercent ?? $withdrawal->getFeePercent());

        $withdrawal
            ->setGrossAmount($amounts['grossAmount'])
            ->setFeePercent($amounts['feePercent'])
            ->setFeeAmount($amounts['feeAmount'])
            ->setNetAmount($amounts['netAmount'])
            ->touch()
        ;
    }

    public function serialize(WithdrawalRequest $withdrawal, bool $includeSensitivePayout = false): array
    {
        $event = $withdrawal->getEvent();
        $organizer = $withdrawal->getOrganizer();

        return [
            'id' => $withdrawal->getId(),
            'status' => $withdrawal->getStatus(),
            'grossAmount' => $withdrawal->getGrossAmount(),
            'feePercent' => $withdrawal->getFeePercent(),
            'feeAmount' => $withdrawal->getFeeAmount(),
            'netAmount' => $withdrawal->getNetAmount(),
            'currency' => $withdrawal->getCurrency(),
            'adminNote' => $withdrawal->getAdminNote(),
            'paymentReference' => $withdrawal->getPaymentReference(),
            'payout' => $this->serializePayoutSnapshot($withdrawal, $includeSensitivePayout),
            'requestedAt' => $withdrawal->getRequestedAt()->format(DATE_ATOM),
            'reviewedAt' => $withdrawal->getReviewedAt()?->format(DATE_ATOM),
            'paidAt' => $withdrawal->getPaidAt()?->format(DATE_ATOM),
            'updatedAt' => $withdrawal->getUpdatedAt()->format(DATE_ATOM),
            'event' => [
                'id' => $event?->getId(),
                'title' => $event?->getTitle(),
                'startDatetime' => $event?->getStartDatetime()?->format(DATE_ATOM),
                'endDatetime' => $event?->getEndDatetime()?->format(DATE_ATOM),
                'withdrawalFeePercent' => $event?->getWithdrawalFeePercent(),
            ],
            'organizer' => [
                'id' => $organizer?->getId(),
                'fullName' => $organizer?->getDisplayName(),
                'email' => $organizer?->getEmail(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function serializePayoutSnapshot(
        WithdrawalRequest $withdrawal,
        bool $includeSensitivePayout
    ): ?array {
        $type = $withdrawal->getPayoutType();

        if (null === $type) {
            return null;
        }

        return [
            'type' => $type,
            'label' => $withdrawal->getPayoutLabel(),
            'bank' => [
                'holderName' => $withdrawal->getBankHolderName(),
                'iban' => $this->maskUnlessAllowed($withdrawal->getBankIban(), $includeSensitivePayout),
                'bic' => $withdrawal->getBankBic(),
                'bankName' => $withdrawal->getBankName(),
            ],
            'mobileMoney' => [
                'name' => $withdrawal->getMobileMoneyName(),
                'phone' => $this->maskUnlessAllowed($withdrawal->getMobileMoneyPhone(), $includeSensitivePayout),
                'provider' => $withdrawal->getMobileMoneyProvider(),
                'country' => $withdrawal->getMobileMoneyCountry(),
            ],
        ];
    }

    private function maskUnlessAllowed(?string $value, bool $includeSensitivePayout): ?string
    {
        if ($includeSensitivePayout || null === $value) {
            return $value;
        }

        $compact = preg_replace('/\s+/', '', $value) ?? $value;
        $length = strlen($compact);

        if ($length <= 4) {
            return str_repeat('*', $length);
        }

        $tail = substr($compact, -4);
        $head = $length > 12 ? substr($compact, 0, 4).' ' : '';

        return $head.'**** **** '.$tail;
    }
}
