<?php

namespace App\Controller;

use App\Entity\Category;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/categories')]
#[IsGranted('ROLE_ADMIN_SUPPORT')]
class AdminCategoryController extends AbstractController
{
    #[Route('', name: 'api_admin_category_index', methods: ['GET'])]
    public function index(CategoryRepository $categoryRepository): JsonResponse
    {
        $categories = $categoryRepository->findBy([], ['id' => 'DESC']);

        $data = array_map(
            fn (Category $category) => $this->serializeCategory($category),
            $categories
        );

        return $this->json($data);
    }

    #[Route('/{id}', name: 'api_admin_category_show', methods: ['GET'])]
    public function show(Category $category): JsonResponse
    {
        return $this->json($this->serializeCategory($category));
    }

    #[Route('', name: 'api_admin_category_create', methods: ['POST'])]
    public function create(
        Request $request,
        CategoryRepository $categoryRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $data = $request->toArray();

        $name = trim((string) ($data['name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));

        if ($name === '' || $description === '') {
            return $this->json([
                'message' => 'Le nom et la description sont obligatoires.'
            ], 400);
        }

        $existingCategory = $categoryRepository->findOneBy(['name' => $name]);

        if ($existingCategory) {
            return $this->json([
                'message' => 'Une catégorie avec ce nom existe déjà.'
            ], 409);
        }

        $category = new Category();
        $category->setName($name);
        $category->setDescription($description);

        $entityManager->persist($category);
        $entityManager->flush();

        return $this->json([
            'message' => 'Catégorie créée avec succès.',
            'category' => $this->serializeCategory($category)
        ], 201);
    }

    #[Route('/{id}', name: 'api_admin_category_update', methods: ['PATCH'])]
    public function update(
        Category $category,
        Request $request,
        CategoryRepository $categoryRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $data = $request->toArray();

        if (array_key_exists('name', $data)) {
            $name = trim((string) $data['name']);

            if ($name === '') {
                return $this->json([
                    'message' => 'Le nom ne peut pas être vide.'
                ], 400);
            }

            $existingCategory = $categoryRepository->findOneBy(['name' => $name]);

            if ($existingCategory && $existingCategory->getId() !== $category->getId()) {
                return $this->json([
                    'message' => 'Une catégorie avec ce nom existe déjà.'
                ], 409);
            }

            $category->setName($name);
        }

        if (array_key_exists('description', $data)) {
            $description = trim((string) $data['description']);

            if ($description === '') {
                return $this->json([
                    'message' => 'La description ne peut pas être vide.'
                ], 400);
            }

            $category->setDescription($description);
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Catégorie mise à jour avec succès.',
            'category' => $this->serializeCategory($category)
        ]);
    }

    #[Route('/{id}', name: 'api_admin_category_delete', methods: ['DELETE'])]
    public function delete(
        Category $category,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        if (!$category->getEvents()->isEmpty()) {
            return $this->json([
                'message' => 'Impossible de supprimer une catégorie déjà liée à des événements.'
            ], 409);
        }

        $entityManager->remove($category);
        $entityManager->flush();

        return $this->json([
            'message' => 'Catégorie supprimée avec succès.'
        ]);
    }

    private function serializeCategory(Category $category): array
    {
        return [
            'id' => $category->getId(),
            'name' => $category->getName(),
            'description' => $category->getDescription(),
        ];
    }
}
