<?php

namespace App\Tests\Service;

use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Mime\BodyRendererInterface;

final class EmailTemplateTest extends KernelTestCase
{
    public function testBrandedEmailEmbedsLogoAndKeepsMobileLayout(): void
    {
        self::bootKernel();

        $email = (new TemplatedEmail())
            ->from('no-reply@eventflow.test')
            ->to('client@example.com')
            ->subject('Confirmation EventFlow')
            ->htmlTemplate('emails/notification.html.twig')
            ->context([
                'emailTitle' => 'Confirmation EventFlow',
                'appUrl' => 'https://eventflow.example',
                'heading' => 'Tes billets sont prêts',
                'details' => ['Commande' => 'ORD-TEST'],
            ])
            ->text('Tes billets sont prêts.');

        static::getContainer()->get(BodyRendererInterface::class)->render($email);

        self::assertStringContainsString('cid:eventflow.png', (string) $email->getHtmlBody());
        self::assertStringContainsString('EventFlow</td>', (string) $email->getHtmlBody());
        self::assertStringContainsString('max-width: 600px', (string) $email->getHtmlBody());
        self::assertStringContainsString('word-break:break-word', (string) $email->getHtmlBody());
        self::assertStringContainsString('image/png', $email->toString());
    }
}
