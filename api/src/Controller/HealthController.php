<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
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
}
