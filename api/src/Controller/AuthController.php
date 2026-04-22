<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class AuthController extends AbstractController
{
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        return $this->json([
            'message' => 'Connexion prise en charge par Symfony Security.'
        ], Response::HTTP_OK);
    }

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $data = $request->toArray();

        if (
            empty($data['email']) ||
            empty($data['password']) ||
            empty($data['firstName']) ||
            empty($data['lastName'])
        ) {
            return $this->json([
                'message' => 'Champs obligatoires manquants.'
            ], 400);
        }

        if ($userRepository->findOneBy(['email' => $data['email']])) {
            return $this->json([
                'message' => 'Cet email existe déjà.'
            ], 409);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setFirstName($data['firstName']);
        $user->setLastName($data['lastName']);
        $user->setRole($data['role'] ?? User::ROLE_CLIENT);
        $user->setCreatedAt(new \DateTimeImmutable());

        $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
        $user->setPasswordHash($hashedPassword);

        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json([
            'message' => 'Utilisateur créé avec succès.'
        ], 201);
    }

    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getAuthenticatedUser();

        if ($user instanceof JsonResponse) {
            return $user;
        }

        return $this->json($this->serializeUser($user));
    }

    #[Route('/api/me', name: 'api_me_update', methods: ['PATCH'])]
    public function updateMe(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getAuthenticatedUser();

        if ($user instanceof JsonResponse) {
            return $user;
        }

        $data = $request->toArray();

        if (isset($data['firstName'])) {
            if (trim((string) $data['firstName']) === '') {
                return $this->json([
                    'message' => 'Le prénom ne peut pas être vide.'
                ], 400);
            }

            $user->setFirstName(trim((string) $data['firstName']));
        }

        if (isset($data['lastName'])) {
            if (trim((string) $data['lastName']) === '') {
                return $this->json([
                    'message' => 'Le nom ne peut pas être vide.'
                ], 400);
            }

            $user->setLastName(trim((string) $data['lastName']));
        }

        if (isset($data['email'])) {
            $newEmail = trim((string) $data['email']);

            if ($newEmail === '') {
                return $this->json([
                    'message' => 'L’email ne peut pas être vide.'
                ], 400);
            }

            $existingUser = $userRepository->findOneBy(['email' => $newEmail]);

            if ($existingUser && $existingUser->getId() !== $user->getId()) {
                return $this->json([
                    'message' => 'Cet email est déjà utilisé.'
                ], 409);
            }

            $user->setEmail($newEmail);
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Profil mis à jour avec succès.',
            'user' => $this->serializeUser($user)
        ]);
    }

    private function getAuthenticatedUser(): User|JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifié.'
            ], 401);
        }

        return $user;
    }

    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'createdAt' => $user->getCreatedAt()?->format(DATE_ATOM),
        ];
    }
}