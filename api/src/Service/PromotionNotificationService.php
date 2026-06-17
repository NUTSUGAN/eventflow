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
            "L’évènement : {$event?->getTitle()}\n".
            "Organisateur : {$organizer?->getFirstName()} {$organizer?->getLastName()}\n".
            "Email : {$organizer?->getEmail()}\n".
            "Canaux : {$channels}\n".
            "Durée : {$campaign->getDuration()}\n".
            "Montant : {$campaign->getTotalPrice()} {$campaign->getCurrency()}\n\n".
            "Ouvrir les campagnes: {$this->frontendUrl('/admin/promotions')}\n"
        );

        $this->send(
            $organizer?->getEmail(),
            'Ta demande Booster a bien été reçue',
            "Bonjour {$organizer?->getFirstName()},\n\n".
            "Ta demande Booster pour {$event?->getTitle()} a bien été transmise à notre équipe.\n".
            "Canaux : {$channels}\n".
            "Montant calculé : {$campaign->getTotalPrice()} {$campaign->getCurrency()}\n\n".
            "Tu recevras un email dès que l’admin aura donné sa réponse.\n"
        );
    }

    public function notifyDecision(PromotionCampaign $campaign, bool $approved): void
    {
        $event = $campaign->getEvent();
        $organizer = $campaign->getOrganizer();
        $subject = $approved
            ? 'Ta campagne Booster est approuvée'
            : 'Réponse à ta demande Booster';
        $decision = $approved
            ? "Ta campagne est approuvée. Tu peux maintenant effectuer le paiement depuis ton espace Booster."
            : "Ta campagne a été refusée. Motif : ".($campaign->getAdminComment() ?? 'Aucun motif précisé.');

        $this->send(
            $organizer?->getEmail(),
            $subject,
            "Bonjour {$organizer?->getFirstName()},\n\n".
            "L’évènement : {$event?->getTitle()}\n".
            "{$decision}\n\n".
            "Consulter la campagne : {$this->frontendUrl('/organizer/promotions')}\n"
        );
    }

    public function notifyPaymentConfirmed(PromotionCampaign $campaign): void
    {
        $event = $campaign->getEvent();
        $organizer = $campaign->getOrganizer();
        $amount = "{$campaign->getTotalPrice()} {$campaign->getCurrency()}";

        $this->send(
            $organizer?->getEmail(),
            'Paiement Booster confirmé',
            "Bonjour {$organizer?->getFirstName()},\n\n".
            "Le paiement de {$amount} pour {$event?->getTitle()} est confirmé.\n".
            "La campagne est maintenant suivie par l’équipe EventFlow. Utilise le bouton SUIVRE pour voir les informations ajoutées par l’admin.\n\n".
            "Suivre la campagne : {$this->frontendUrl('/organizer/promotions/'.(string) $campaign->getId())}\n"
        );

        $this->send(
            $this->reviewEmail,
            'Paiement Booster reçu',
            "Un paiement Booster vient d’être confirmé.\n\n".
            "L’évènement : {$event?->getTitle()}\n".
            "Organisateur : {$organizer?->getFirstName()} {$organizer?->getLastName()}\n".
            "Montant : {$amount}\n".
            "Canaux : {$this->channelLabels($campaign)}\n\n".
            "Compléter le suivi : {$this->frontendUrl('/admin/promotions/'.(string) $campaign->getId())}\n"
        );
    }

    public function notifyTrackingUpdated(PromotionCampaign $campaign, PromotionCampaignChannel $channel): void
    {
        $event = $campaign->getEvent();
        $organizer = $campaign->getOrganizer();
        $adminBrief = $channel->getAdminBrief();

        $body = "Bonjour {$organizer?->getFirstName()},\n\n".
            "Le suivi Booster de ton événement a été mis à jour.\n\n".
            "Événement : {$event?->getTitle()}\n".
            "Canal : {$this->channelLabel($channel)}\n".
            "État : {$this->deliveryStatusLabel($channel->getDeliveryStatus())}\n";

        if (null !== $adminBrief) {
            $body .= "\nInformation EventFlow :\n{$adminBrief}\n";
        }

        if ($channel->isFeatured()) {
            $body .= "\nTon événement est actuellement mis en avant par EventFlow.\n";
        }

        $body .= "\nSuivre la campagne : {$this->frontendUrl('/organizer/promotions/'.(string) $campaign->getId())}\n";

        $this->send(
            $organizer?->getEmail(),
            'Suivi Booster mis à jour',
            $body
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
            $labels[] = $this->channelLabel($channel);
        }

        return implode(', ', $labels);
    }

    private function channelLabel(PromotionCampaignChannel $channel): string
    {
        return match ($channel->getChannelCode()) {
            PromotionCampaignChannel::CHANNEL_LAUNCH_PACK => 'Pack Lancement',
            PromotionCampaignChannel::CHANNEL_SOCIAL_INFLUENCER => 'Réseaux sociaux / influenceurs',
            PromotionCampaignChannel::CHANNEL_NEWSLETTER => 'Newsletter',
            default => (string) $channel->getChannelCode(),
        };
    }

    private function deliveryStatusLabel(string $deliveryStatus): string
    {
        return match ($deliveryStatus) {
            PromotionCampaignChannel::DELIVERY_PENDING => 'En attente',
            PromotionCampaignChannel::DELIVERY_SCHEDULED => 'Planifié',
            PromotionCampaignChannel::DELIVERY_ACTIVE => 'En diffusion',
            PromotionCampaignChannel::DELIVERY_DELIVERED => 'Livré',
            PromotionCampaignChannel::DELIVERY_CANCELLED => 'Annulé',
            default => $deliveryStatus,
        };
    }
}
