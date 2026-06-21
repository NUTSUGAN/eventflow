<?php

namespace App\Controller;

use App\Entity\OrganizerPayoutAccount;
use App\Entity\User;
use App\Repository\OrganizerPayoutAccountRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/organizer/payout-account')]
final class OrganizerPayoutAccountController extends AbstractController
{
    #[Route('', name: 'api_organizer_payout_account_show', methods: ['GET'])]
    public function show(OrganizerPayoutAccountRepository $payoutAccountRepository): JsonResponse
    {
        $user = $this->getOrganizerUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Acces reserve aux organisateurs.'], Response::HTTP_FORBIDDEN);
        }

        $active = $payoutAccountRepository->findActiveForOrganizer($user);
        $history = $payoutAccountRepository->findInactiveHistoryForOrganizer($user);

        return $this->json([
            'active' => $active instanceof OrganizerPayoutAccount ? $this->serialize($active) : null,
            'history' => array_map($this->serialize(...), $history),
        ]);
    }

    #[Route('', name: 'api_organizer_payout_account_store', methods: ['POST'])]
    public function store(
        Request $request,
        OrganizerPayoutAccountRepository $payoutAccountRepository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $user = $this->getOrganizerUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Acces reserve aux organisateurs.'], Response::HTTP_FORBIDDEN);
        }

        $data = $request->toArray();
        $type = strtolower(trim((string) ($data['type'] ?? '')));

        if (!in_array($type, OrganizerPayoutAccount::TYPES, true)) {
            return $this->json(['message' => 'Choisis compte bancaire ou Mobile Money.'], Response::HTTP_BAD_REQUEST);
        }

        $validationError = $this->validatePayload($type, $data);

        if (null !== $validationError) {
            return $this->json(['message' => $validationError], Response::HTTP_BAD_REQUEST);
        }

        $now = new \DateTimeImmutable();
        $active = $payoutAccountRepository->findActiveForOrganizer($user);

        if ($active instanceof OrganizerPayoutAccount) {
            $active->replace($now);
            $entityManager->persist($active);
        }

        $payoutAccount = (new OrganizerPayoutAccount())
            ->setOrganizer($user)
            ->setType($type)
            ->setLabel($this->normalizeNullableString($data['label'] ?? null))
            ->setCreatedAt($now)
        ;

        if (OrganizerPayoutAccount::TYPE_BANK === $type) {
            $payoutAccount
                ->setHolderName($this->normalizeNullableString($data['holderName'] ?? null))
                ->setIban($this->normalizeBankIdentifier($data['iban'] ?? null))
                ->setBic($this->normalizeBankIdentifier($data['bic'] ?? null))
                ->setBankName($this->normalizeNullableString($data['bankName'] ?? null))
            ;
        } else {
            $payoutAccount
                ->setMobileMoneyName($this->normalizeNullableString($data['mobileMoneyName'] ?? null))
                ->setMobileMoneyPhone($this->normalizeNullableString($data['mobileMoneyPhone'] ?? null))
                ->setMobileMoneyProvider($this->normalizeNullableString($data['mobileMoneyProvider'] ?? null))
                ->setMobileMoneyCountry($this->normalizeNullableString($data['mobileMoneyCountry'] ?? null))
            ;
        }

        $entityManager->persist($payoutAccount);
        $entityManager->flush();

        return $this->json([
            'message' => 'Moyen de retrait enregistre.',
            'active' => $this->serialize($payoutAccount),
            'history' => array_map(
                $this->serialize(...),
                $payoutAccountRepository->findInactiveHistoryForOrganizer($user)
            ),
        ], Response::HTTP_CREATED);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function validatePayload(string $type, array $data): ?string
    {
        if (OrganizerPayoutAccount::TYPE_BANK === $type) {
            if (null === $this->normalizeNullableString($data['holderName'] ?? null)) {
                return 'Le nom du titulaire est obligatoire.';
            }

            if (null === $this->normalizeBankIdentifier($data['iban'] ?? null)) {
                return 'IBAN obligatoire.';
            }

            if (null === $this->normalizeBankIdentifier($data['bic'] ?? null)) {
                return 'BIC obligatoire.';
            }

            return null;
        }

        if (null === $this->normalizeNullableString($data['mobileMoneyName'] ?? null)) {
            return 'Le nom du titulaire Mobile Money est obligatoire.';
        }

        if (null === $this->normalizeNullableString($data['mobileMoneyPhone'] ?? null)) {
            return 'Le numero Mobile Money est obligatoire.';
        }

        if (null === $this->normalizeNullableString($data['mobileMoneyProvider'] ?? null)) {
            return 'L operateur Mobile Money est obligatoire.';
        }

        if (null === $this->normalizeNullableString($data['mobileMoneyCountry'] ?? null)) {
            return 'Le pays Mobile Money est obligatoire.';
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(OrganizerPayoutAccount $payoutAccount): array
    {
        return [
            'id' => $payoutAccount->getId(),
            'type' => $payoutAccount->getType(),
            'label' => $payoutAccount->getLabel(),
            'isActive' => $payoutAccount->isActive(),
            'createdAt' => $payoutAccount->getCreatedAt()->format(DATE_ATOM),
            'replacedAt' => $payoutAccount->getReplacedAt()?->format(DATE_ATOM),
            'bank' => [
                'holderName' => $payoutAccount->getHolderName(),
                'iban' => $this->maskValue($payoutAccount->getIban()),
                'bic' => $payoutAccount->getBic(),
                'bankName' => $payoutAccount->getBankName(),
            ],
            'mobileMoney' => [
                'name' => $payoutAccount->getMobileMoneyName(),
                'phone' => $this->maskValue($payoutAccount->getMobileMoneyPhone()),
                'provider' => $payoutAccount->getMobileMoneyProvider(),
                'country' => $payoutAccount->getMobileMoneyCountry(),
            ],
        ];
    }

    private function getOrganizerUser(): ?User
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return null;
        }

        $roles = $user->getRoles();

        if (!in_array(User::ROLE_ORGANIZER, $roles, true) && !in_array(User::ROLE_ADMIN, $roles, true)) {
            return null;
        }

        return $user;
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' !== $value ? $value : null;
    }

    private function normalizeBankIdentifier(mixed $value): ?string
    {
        $value = $this->normalizeNullableString($value);

        return null !== $value ? strtoupper(str_replace(' ', '', $value)) : null;
    }

    private function maskValue(?string $value): ?string
    {
        if (null === $value) {
            return null;
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
