<?php

namespace App\Tests\Service;

use App\Entity\OrganizerPayoutAccount;
use App\Entity\WithdrawalRequest;
use App\Service\TogoPayoutDetails;
use PHPUnit\Framework\TestCase;

final class TogoPayoutDetailsTest extends TestCase
{
    public function testLocalAndInternationalPhonesResolveToSameNumber(): void
    {
        $service = new TogoPayoutDetails();
        foreach (['90 00 00 00', '+228 90 00 00 00', '0022890000000'] as $phone) {
            self::assertSame('+22890000000', $service->normalizePhone($phone));
        }
    }

    public function testForeignOrIncompletePhoneIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new TogoPayoutDetails())->normalizePhone('+3390000000');
    }

    public function testBankReferenceDoesNotRequireIbanOrBic(): void
    {
        $data = (new TogoPayoutDetails())->normalize([
            'type' => 'bank', 'holderName' => 'Client Test', 'bankName' => 'Banque de test', 'bankAccountReference' => 'REF-TEST',
        ]);
        self::assertSame('REF-TEST', $data['bankAccountReference']);
        self::assertSame('', $data['iban']);
        self::assertSame('', $data['bic']);
    }

    public function testDisabledOperatorCannotBeSaved(): void
    {
        $previous = $_ENV['PAYOUT_MOBILE_MONEY_PROVIDERS'] ?? null;
        $_ENV['PAYOUT_MOBILE_MONEY_PROVIDERS'] = 'mixx_tg';
        try {
            $this->expectException(\InvalidArgumentException::class);
            (new TogoPayoutDetails())->normalize(['type' => 'mobile_money', 'mobileMoneyName' => 'Client', 'mobileMoneyProvider' => 'moov_tg', 'mobileMoneyPhone' => '90000000']);
        } finally {
            if (null === $previous) { unset($_ENV['PAYOUT_MOBILE_MONEY_PROVIDERS']); } else { $_ENV['PAYOUT_MOBILE_MONEY_PROVIDERS'] = $previous; }
        }
    }

    public function testWithdrawalKeepsBankSnapshotAndStartsPending(): void
    {
        $account = (new OrganizerPayoutAccount())->setType('bank')->setBankAccountReference('INITIAL-REF');
        $withdrawal = (new WithdrawalRequest())->copyPayoutAccount($account);
        $account->setBankAccountReference('NEW-REF');
        self::assertSame('INITIAL-REF', $withdrawal->getBankAccountReference());
        self::assertSame('pending', $withdrawal->getStatus());
        self::assertNull($withdrawal->getPaidAt());
    }
}
