<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class HealthController
{
    #[Route('/', name: 'app_home', methods: ['GET'])]
    public function home(): JsonResponse
    {
        return new JsonResponse([
            'name' => 'EventFlow API',
            'status' => 'running',
            'health' => '/api/health',
        ]);
    }

    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    public function health(): JsonResponse
    {
        return new JsonResponse([
            'status' => 'ok',
            'service' => 'eventflow-api',
        ]);
    }

    #[Route('/favicon.ico', name: 'app_favicon', methods: ['GET'])]
    public function favicon(): Response
    {
        return new Response('', Response::HTTP_NO_CONTENT);
    }
}
