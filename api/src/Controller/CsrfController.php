<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final class CsrfController
{
    #[Route('/api/csrf-token', name: 'api_csrf_token', methods: ['GET'])]
    public function token(CsrfTokenManagerInterface $tokens): JsonResponse
    {
        return new JsonResponse(['token' => $tokens->getToken('api')->getValue()], 200, [
            'Cache-Control' => 'no-store, private',
        ]);
    }
}
