<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\MailerConfiguration;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Routing\Attribute\Route;

final class ContactController extends AbstractController
{
    #[Route('/api/contact', name: 'api_contact_create', methods: ['POST'])]
    public function create(
        Request $request,
        MailerInterface $mailer,
        MailerConfiguration $mailerConfiguration,
    ): JsonResponse {
        $data = $request->toArray();
        $name = trim((string) ($data['name'] ?? ''));
        $email = mb_strtolower(trim((string) ($data['email'] ?? '')));
        $phone = trim((string) ($data['phone'] ?? ''));
        $subject = trim((string) ($data['subject'] ?? ''));
        $category = trim((string) ($data['category'] ?? ''));
        $message = trim((string) ($data['message'] ?? ''));

        if ('' === $name || '' === $email || '' === $subject || '' === $message) {
            return $this->json([
                'message' => 'Renseigne ton nom, ton email, le sujet et ton message.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (false === filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json([
                'message' => 'Renseigne une adresse email valide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (mb_strlen($name) > 120 || mb_strlen($subject) > 160 || mb_strlen($phone) > 40) {
            return $this->json([
                'message' => 'Le nom, le sujet ou le téléphone est trop long.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (mb_strlen($message) > 3000) {
            return $this->json([
                'message' => 'Le message est trop long.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $currentUser = $this->getUser();
        $accountLine = $currentUser instanceof User
            ? sprintf('%s <%s>', $currentUser->getDisplayName(), $currentUser->getEmail() ?? 'email inconnu')
            : 'Visiteur non connecté';

        try {
            $mailer->send(
                (new TemplatedEmail())
                    ->from($mailerConfiguration->fromEmail())
                    ->replyTo($email)
                    ->to($mailerConfiguration->reviewEmail())
                    ->subject('[Contact EventFlow] '.$subject)
                    ->htmlTemplate('emails/notification.html.twig')
                    ->context([
                        'emailTitle' => 'Nouvelle demande de contact',
                        'preheader' => $subject,
                        'appUrl' => rtrim((string) ($_SERVER['FRONTEND_APP_URL'] ?? $_ENV['FRONTEND_APP_URL'] ?? 'http://localhost:5173'), '/'),
                        'logoUrl' => rtrim((string) ($_SERVER['FRONTEND_APP_URL'] ?? $_ENV['FRONTEND_APP_URL'] ?? 'http://localhost:5173'), '/').'/eventflow-logo.png',
                        'eyebrow' => 'Administration',
                        'heading' => 'Nouvelle demande de contact',
                        'details' => [
                            'Nom' => $name,
                            'E-mail' => $email,
                            ...('' !== $phone ? ['Téléphone' => $phone] : []),
                            'Catégorie' => '' !== $category ? $category : 'Non précisée',
                            'Sujet' => $subject,
                        ],
                        'bodyText' => $message,
                    ])
                    ->text(implode("\n", [
                        'Nouvelle demande reçue depuis le formulaire Contact EventFlow.',
                        '',
                        'Nom : '.$name,
                        'Email : '.$email,
                        ...('' !== $phone ? ['Téléphone : '.$phone] : []),
                        'Catégorie : '.('' !== $category ? $category : 'Non précisée'),
                        'Compte EventFlow : '.$accountLine,
                        '',
                        'Sujet : '.$subject,
                        '',
                        'Message :',
                        $message,
                    ]))
            );

            $mailer->send(
                (new TemplatedEmail())
                    ->from($mailerConfiguration->fromEmail())
                    ->to($email)
                    ->subject('Ta demande EventFlow a bien été reçue')
                    ->htmlTemplate('emails/notification.html.twig')
                    ->context([
                        'emailTitle' => 'Demande reçue',
                        'preheader' => 'L’équipe EventFlow a bien reçu ton message.',
                        'appUrl' => rtrim((string) ($_SERVER['FRONTEND_APP_URL'] ?? $_ENV['FRONTEND_APP_URL'] ?? 'http://localhost:5173'), '/'),
                        'logoUrl' => rtrim((string) ($_SERVER['FRONTEND_APP_URL'] ?? $_ENV['FRONTEND_APP_URL'] ?? 'http://localhost:5173'), '/').'/eventflow-logo.png',
                        'eyebrow' => 'Contact EventFlow',
                        'heading' => 'Ton message est bien arrivé',
                        'greeting' => 'Bonjour '.$name.',',
                        'paragraphs' => [
                            'Nous avons bien reçu ta demande adressée à l’équipe EventFlow.',
                            'Notre équipe te répondra directement à cette adresse e-mail.',
                        ],
                        'details' => [
                            'Sujet' => $subject,
                            'Catégorie' => '' !== $category ? $category : 'Non précisée',
                        ],
                    ])
                    ->text(implode("\n", [
                        'Bonjour '.$name.',',
                        '',
                        'Nous avons bien reçu ta demande adressée à l’équipe EventFlow.',
                        '',
                        'Sujet : '.$subject,
                        'Catégorie : '.('' !== $category ? $category : 'Non précisée'),
                        '',
                        'Notre équipe te répondra à cette adresse email.',
                    ]))
            );
        } catch (\Throwable) {
            return $this->json([
                'message' => 'Impossible d’envoyer ton message pour le moment.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return $this->json([
            'message' => 'Merci, ton message a bien été envoyé à l’équipe EventFlow.',
        ], Response::HTTP_CREATED);
    }
}
