<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\EventReport;
use App\Entity\User;
use App\Repository\EventRepository;
use App\Repository\EventReportRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;

final class EventReportController extends AbstractController
{
    #[Route('/api/events/{id}/report', name: 'api_event_report', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function create(
        int $id,
        Request $request,
        EventRepository $eventRepository,
        EventReportRepository $eventReportRepository,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer,
        #[Autowire('%env(string:FRONTEND_APP_URL)%')]
        string $frontendAppUrl,
    ): JsonResponse {
        $reporter = $this->getUser();

        if (!$reporter instanceof User) {
            return $this->json([
                'message' => 'Connecte-toi pour signaler un evenement.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $event = $eventRepository->findOneForPublicDetail($id);

        if (!$event instanceof Event) {
            return $this->json([
                'message' => 'Evenement introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($event->getOrganizer()?->getId() === $reporter->getId()) {
            return $this->json([
                'message' => 'Tu ne peux pas signaler ton propre evenement.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $data = $request->toArray();
        $reason = trim((string) ($data['reason'] ?? ''));
        $details = trim((string) ($data['details'] ?? ''));

        if ('' === $reason) {
            return $this->json([
                'message' => 'Choisis une raison pour ton signalement.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (mb_strlen($reason) > 80) {
            return $this->json([
                'message' => 'La raison du signalement est trop longue.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (mb_strlen($details) > 1500) {
            return $this->json([
                'message' => 'Le message de signalement est trop long.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $existingPendingReport = $eventReportRepository->findPendingForReporterAndEvent($reporter, $event);

        if ($existingPendingReport instanceof EventReport) {
            return $this->json([
                'message' => 'Ton signalement est deja en attente de traitement.',
            ], Response::HTTP_CONFLICT);
        }

        $eventReport = (new EventReport())
            ->setEvent($event)
            ->setReporter($reporter)
            ->setReason($reason)
            ->setDetails('' !== $details ? $details : null)
            ->setStatus(EventReport::STATUS_PENDING)
            ->setCreatedAt(new \DateTimeImmutable());

        $entityManager->persist($eventReport);
        $entityManager->flush();

        try {
            $mailer->send(
                (new Email())
                    ->from('no-reply@eventflow.local')
                    ->to('admin@eventflow.local')
                    ->subject("Nouveau signalement d'evenement EventFlow")
                    ->text($this->buildAdminNotificationBody($event, $reporter, $eventReport, $frontendAppUrl))
            );
        } catch (\Throwable) {
            // Le signalement est garde en base meme si l'email admin ne part pas.
        }

        return $this->json([
            'message' => 'Merci, ton signalement a bien ete transmis a l equipe EventFlow.',
        ], Response::HTTP_CREATED);
    }

    private function buildAdminNotificationBody(
        Event $event,
        User $reporter,
        EventReport $eventReport,
        string $frontendAppUrl,
    ): string {
        $eventUrl = rtrim($frontendAppUrl, '/').'/events/'.$event->getId();
        $organizer = $event->getOrganizer()?->getDisplayName() ?? 'Organisateur inconnu';

        return implode("\n", [
            'Bonjour,',
            '',
            'Un evenement public a ete signale sur EventFlow.',
            '',
            'Evenement signale : '.($event->getTitle() ?? 'Evenement inconnu'),
            'Organisateur concerne : '.$organizer,
            'Motif : '.($eventReport->getReason() ?? 'Non renseigne'),
            'Signale par : '.$reporter->getDisplayName().' <'.($reporter->getEmail() ?? 'email inconnu').'>',
            'Cree le : '.($eventReport->getCreatedAt()?->format('d/m/Y H:i') ?? 'date inconnue'),
            '',
            'Details :',
            $eventReport->getDetails() ?? 'Aucun detail supplementaire.',
            '',
            'Voir la fiche publique : '.$eventUrl,
        ]);
    }
}
