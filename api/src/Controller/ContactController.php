<?php

namespace App\Controller;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;

final class ContactController extends AbstractController
{
    #[Route('/api/contact', name: 'api_contact_create', methods: ['POST'])]
    public function create(
        Request $request,
        MailerInterface $mailer,
        #[Autowire('%env(string:ORGANIZER_REVIEW_EMAIL)%')]
        string $reviewEmail,
        #[Autowire('%env(string:MAILER_FROM_EMAIL)%')]
        string $fromEmail,
    ): JsonResponse {
        $data = $request->toArray();
        $name = trim((string) ($data['name'] ?? ''));
        $email = mb_strtolower(trim((string) ($data['email'] ?? '')));
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

        if (mb_strlen($name) > 120 || mb_strlen($subject) > 160) {
            return $this->json([
                'message' => 'Le nom ou le sujet est trop long.',
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
                (new Email())
                    ->from($fromEmail)
                    ->replyTo($email)
                    ->to($reviewEmail)
                    ->subject('[Contact EventFlow] '.$subject)
                    ->text(implode("\n", [
                        'Nouvelle demande reçue depuis le formulaire Contact EventFlow.',
                        '',
                        'Nom : '.$name,
                        'Email : '.$email,
                        'Catégorie : '.('' !== $category ? $category : 'Non précisée'),
                        'Compte EventFlow : '.$accountLine,
                        '',
                        'Sujet : '.$subject,
                        '',
                        'Message :',
                        $message,
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
