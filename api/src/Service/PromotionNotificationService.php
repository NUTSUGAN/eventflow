<?php

namespace App\Service;

use App\Entity\PromotionCampaign;
use App\Entity\PromotionCampaignChannel;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class PromotionNotificationService
{
    public function __construct(
        private readonly MailerInterface $mailer,
        #[Autowire('%env(string:ORGANIZER_REVIEW_EMAIL)%')]
        private readonly string $reviewEmail,
        #[Autowire('%env(string:FRONTEND_APP_URL)%')]
        private readonly string $frontendUrl,
        #[Autowire('%env(string:MAILER_FROM_EMAIL)%')]
        private readonly string $fromEmail,
    ) {
    }

    public function notifyNewRequest(PromotionCampaign $campaign): void
    {
        $event = $campaign->getEvent();
        $organizer = $campaign->getOrganizer();
        $channels = $this->channelLabels($campaign);

        $this->send(
            $this->reviewEmail,
            'Nouvelle demande Booster EventFlow',
            "Une nouvelle demande Booster attend une validation.\n\n".
            "Evenement: {$event?->getTitle()}\n".
            "Organisateur: {$organizer?->getFirstName()} {$organizer?->getLastName()}\n".
            "Email: {$organizer?->getEmail()}\n".
            "Canaux: {$channels}\n".
            "Duree: {$campaign->getDuration()}\n".
            "Montant: {$campaign->getTotalPrice()} {$campaign->getCurrency()}\n\n".
            "Ouvrir les campagnes: {$this->frontendUrl('/admin/promotions')}\n"
        );

        $this->send(
            $organizer?->getEmail(),
            'Ta demande Booster a bien ete recue',
            "Bonjour {$organizer?->getFirstName()},\n\n".
            "Ta demande Booster pour {$event?->getTitle()} a bien ete transmise a notre equipe.\n".
            "Canaux: {$channels}\n".
            "Montant calcule: {$campaign->getTotalPrice()} {$campaign->getCurrency()}\n\n".
            "Tu recevras un email des que l admin aura donne sa reponse.\n"
        );
    }

    public function notifyDecision(PromotionCampaign $campaign, bool $approved): void
    {
        $event = $campaign->getEvent();
        $organizer = $campaign->getOrganizer();
        $subject = $approved
            ? 'Ta campagne Booster est approuvee'
            : 'Reponse a ta demande Booster';
        $decision = $approved
            ? "Ta campagne est approuvee. Tu peux maintenant effectuer le paiement depuis ton espace Booster."
            : "Ta campagne a ete refusee. Motif: ".($campaign->getAdminComment() ?? 'Aucun motif precise.');

        $this->send(
            $organizer?->getEmail(),
            $subject,
            "Bonjour {$organizer?->getFirstName()},\n\n".
            "Evenement: {$event?->getTitle()}\n".
            "{$decision}\n\n".
            "Consulter la campagne: {$this->frontendUrl('/organizer/promotions')}\n"
        );
    }

    public function notifyPaymentConfirmed(PromotionCampaign $campaign): void
    {
        $event = $campaign->getEvent();
        $organizer = $campaign->getOrganizer();
        $amount = "{$campaign->getTotalPrice()} {$campaign->getCurrency()}";

        $this->send(
            $organizer?->getEmail(),
            'Paiement Booster confirme',
            "Bonjour {$organizer?->getFirstName()},\n\n".
            "Le paiement de {$amount} pour {$event?->getTitle()} est confirme.\n".
            "La campagne est maintenant suivie par l equipe EventFlow. Utilise le bouton SUIVRE pour voir les informations ajoutees par l admin.\n\n".
            "Suivre la campagne: {$this->frontendUrl('/organizer/promotions/'.(string) $campaign->getId())}\n"
        );

        $this->send(
            $this->reviewEmail,
            'Paiement Booster recu',
            "Un paiement Booster vient d etre confirme.\n\n".
            "Evenement: {$event?->getTitle()}\n".
            "Organisateur: {$organizer?->getFirstName()} {$organizer?->getLastName()}\n".
            "Montant: {$amount}\n".
            "Canaux: {$this->channelLabels($campaign)}\n\n".
            "Completer le suivi: {$this->frontendUrl('/admin/promotions/'.(string) $campaign->getId())}\n"
        );
    }

    private function send(?string $recipient, string $subject, string $body): void
    {
        if (!is_string($recipient) || '' === trim($recipient)) {
            return;
        }

        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->fromEmail)
                    ->to(trim($recipient))
                    ->subject($subject)
                    ->text($body)
            );
        } catch (\Throwable) {
            // A mail outage must not roll back a campaign or a confirmed payment.
        }
    }

    private function frontendUrl(string $path): string
    {
        return rtrim($this->frontendUrl, '/').'/'.ltrim($path, '/');
    }

    private function channelLabels(PromotionCampaign $campaign): string
    {
        $labels = [];

        foreach ($campaign->getChannels() as $channel) {
            $labels[] = match ($channel->getChannelCode()) {
                PromotionCampaignChannel::CHANNEL_LAUNCH_PACK => 'Pack Lancement',
                PromotionCampaignChannel::CHANNEL_SOCIAL_INFLUENCER => 'Reseaux sociaux / influenceurs',
                PromotionCampaignChannel::CHANNEL_NEWSLETTER => 'Newsletter',
                default => (string) $channel->getChannelCode(),
            };
        }

        return implode(', ', $labels);
    }
}
