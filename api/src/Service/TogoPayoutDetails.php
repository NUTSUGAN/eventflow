<?php

namespace App\Service;

final class TogoPayoutDetails
{
    public const PROVIDERS = ['moov_tg' => 'Moov Money Togo', 'mixx_tg' => 'Mixx by Yas Togo'];

    public function providers(): array
    {
        $configured = $_ENV['PAYOUT_MOBILE_MONEY_PROVIDERS'] ?? $_SERVER['PAYOUT_MOBILE_MONEY_PROVIDERS'] ?? 'moov_tg,mixx_tg';
        return array_intersect_key(self::PROVIDERS, array_flip(array_filter(array_map('trim', explode(',', $configured)))));
    }

    public function normalizePhone(string $value): string
    {
        $value = preg_replace('/[\s().-]/', '', $value) ?? '';
        if (str_starts_with($value, '00228')) { $value = '+228'.substr($value, 5); }
        if (preg_match('/^\d{8}$/D', $value)) { $value = '+228'.$value; }
        if (!preg_match('/^\+228\d{8}$/D', $value)) {
            throw new \InvalidArgumentException('Renseigne un numéro togolais de 8 chiffres, avec ou sans +228.');
        }
        return $value;
    }

    public function normalize(array $data): array
    {
        $limits = ['label' => 120, 'holderName' => 160, 'bankAccountReference' => 120, 'iban' => 80,
            'bic' => 40, 'bankName' => 120, 'mobileMoneyName' => 160, 'mobileMoneyProvider' => 80, 'mobileMoneyCountry' => 80];
        foreach ($limits as $field => $limit) {
            $data[$field] = trim((string) ($data[$field] ?? ''));
            if (mb_strlen($data[$field]) > $limit) { throw new \InvalidArgumentException('Une coordonnée dépasse la longueur autorisée.'); }
        }
        if ('bank' === ($data['type'] ?? '')) {
            if ('' === $data['holderName'] || '' === $data['bankName'] || ('' === $data['bankAccountReference'] && '' === $data['iban'])) {
                throw new \InvalidArgumentException('Le titulaire, la banque et le RIB ou numéro de compte sont obligatoires.');
            }
        } else {
            if ('' === $data['mobileMoneyName']) { throw new \InvalidArgumentException('Le nom du titulaire Mobile Money est obligatoire.'); }
            if (!array_key_exists($data['mobileMoneyProvider'], $this->providers())) { throw new \InvalidArgumentException('Cet opérateur n’est pas disponible pour les retraits.'); }
            $data['mobileMoneyPhone'] = $this->normalizePhone((string) ($data['mobileMoneyPhone'] ?? ''));
            $data['mobileMoneyCountry'] = 'Togo';
        }
        return $data;
    }
}
