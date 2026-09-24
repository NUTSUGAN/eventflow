<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class MailerConfiguration
{
    public function __construct(
        #[Autowire('%env(string:MAILER_FROM_EMAIL)%')]
        private string $fromEmail,
        #[Autowire('%env(string:ORGANIZER_REVIEW_EMAIL)%')]
        private string $reviewEmail,
    ) {
    }

    public function fromEmail(): string
    {
        return $this->fromEmail;
    }

    public function reviewEmail(): string
    {
        return $this->reviewEmail;
    }
}
