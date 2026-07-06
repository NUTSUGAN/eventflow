<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpClient\Exception\TransportException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class UploadedImageStorage
{
    public function __construct(
        private HttpClientInterface $httpClient,
        #[Autowire('%kernel.project_dir%')]
        private string $projectDir,
        #[Autowire('%env(string:SUPABASE_URL)%')]
        private string $supabaseUrl = '',
        #[Autowire('%env(string:SUPABASE_STORAGE_KEY)%')]
        private string $supabaseStorageKey = '',
        #[Autowire('%env(string:SUPABASE_STORAGE_BUCKET)%')]
        private string $supabaseStorageBucket = 'eventflow-media',
    ) {
    }

    public function storeUploadedImage(UploadedFile $file, string $folder, string $fallbackName): string
    {
        if (!$file->isValid()) {
            throw new \RuntimeException($this->getUploadErrorMessage($file->getError()));
        }

        $mimeType = $file->getMimeType() ?? $file->getClientMimeType() ?? '';

        if (!str_starts_with($mimeType, 'image/')) {
            throw new \RuntimeException('Le fichier envoye doit etre une image.');
        }

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = $this->sanitizeFilename($originalName, $fallbackName);
        $extension = $file->guessExtension() ?: pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION) ?: 'bin';
        $filename = uniqid($fallbackName.'_', true).'-'.$safeName.'.'.strtolower($extension);

        if ($this->isSupabaseConfigured()) {
            return $this->uploadToSupabase(
                $folder.'/'.$filename,
                (string) file_get_contents($file->getPathname()),
                $mimeType,
            );
        }

        $uploadDir = $this->projectDir.'/public/uploads/'.$folder;

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $file->move($uploadDir, $filename);

        return '/uploads/'.$folder.'/'.$filename;
    }

    public function storeUploadedVideo(UploadedFile $file, string $folder, string $fallbackName): string
    {
        if (!$file->isValid()) {
            throw new \RuntimeException('La video envoyee est invalide ou trop lourde.');
        }

        $mimeType = $file->getMimeType() ?? $file->getClientMimeType() ?? '';

        if (!str_starts_with($mimeType, 'video/')) {
            throw new \RuntimeException('Le fichier envoye doit etre une video.');
        }

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = $this->sanitizeFilename($originalName, $fallbackName);
        $extension = pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION) ?: 'mp4';
        $filename = uniqid($fallbackName.'_', true).'-'.$safeName.'.'.strtolower($extension);

        if ($this->isSupabaseConfigured()) {
            return $this->uploadToSupabase(
                $folder.'/'.$filename,
                (string) file_get_contents($file->getPathname()),
                $mimeType,
            );
        }

        $uploadDir = $this->projectDir.'/public/uploads/'.$folder;

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $file->move($uploadDir, $filename);

        return '/uploads/'.$folder.'/'.$filename;
    }

    public function storeDataUrlImage(string $dataUrl, string $folder, string $fallbackName): string
    {
        if (!preg_match('/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/', $dataUrl, $matches)) {
            throw new \RuntimeException('Le format de la photo de profil est invalide.');
        }

        $mimeType = strtolower((string) ($matches[1] ?? ''));

        if (!str_starts_with($mimeType, 'image/')) {
            throw new \RuntimeException('La photo de profil doit etre une image.');
        }

        $rawData = base64_decode((string) ($matches[2] ?? ''), true);

        if (false === $rawData || '' === $rawData) {
            throw new \RuntimeException('Impossible de decoder la photo de profil.');
        }

        $extension = match ($mimeType) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'bin',
        };
        $filename = uniqid($fallbackName.'_', true).'-upload.'.$extension;

        if ($this->isSupabaseConfigured()) {
            return $this->uploadToSupabase($folder.'/'.$filename, $rawData, $mimeType);
        }

        $uploadDir = $this->projectDir.'/public/uploads/'.$folder;

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $targetPath = $uploadDir.'/'.$filename;

        if (false === file_put_contents($targetPath, $rawData)) {
            throw new \RuntimeException('Impossible d enregistrer la photo de profil.');
        }

        return '/uploads/'.$folder.'/'.$filename;
    }

    public function remove(?string $storedPath): void
    {
        if (!is_string($storedPath) || '' === trim($storedPath)) {
            return;
        }

        $storedPath = trim($storedPath);

        if (str_starts_with($storedPath, '/uploads/')) {
            $fullPath = $this->projectDir.'/public'.$storedPath;

            if (is_file($fullPath)) {
                unlink($fullPath);
            }

            return;
        }

        $objectPath = $this->resolveSupabaseObjectPath($storedPath);

        if (null === $objectPath || !$this->isSupabaseConfigured()) {
            return;
        }

        try {
            $this->httpClient->request(
                'DELETE',
                $this->getSupabaseBaseUrl().'/storage/v1/object/'.$this->supabaseStorageBucket,
                [
                    'headers' => $this->getSupabaseHeaders(),
                    'json' => [
                        'prefixes' => [$objectPath],
                    ],
                ],
            )->getStatusCode();
        } catch (\Throwable) {
            // Deleting old media is best-effort and must not block the user flow.
        }
    }

    private function uploadToSupabase(string $objectPath, string $contents, string $mimeType): string
    {
        try {
            $response = $this->httpClient->request(
                'POST',
                $this->getSupabaseBaseUrl().'/storage/v1/object/'.$this->supabaseStorageBucket.'/'.$objectPath,
                [
                    'headers' => $this->getSupabaseHeaders([
                        'Content-Type' => $mimeType,
                        'x-upsert' => 'false',
                    ]),
                    'body' => $contents,
                ],
            );

            if ($response->getStatusCode() >= 400) {
                throw new \RuntimeException('Supabase Storage a refuse l image envoyee.');
            }
        } catch (TransportException|\RuntimeException) {
            throw new \RuntimeException('Impossible d enregistrer l image sur Supabase Storage.');
        }

        return $this->getSupabaseBaseUrl().'/storage/v1/object/public/'.$this->supabaseStorageBucket.'/'.$objectPath;
    }

    /**
     * @param array<string, string> $headers
     *
     * @return array<string, string>
     */
    private function getSupabaseHeaders(array $headers = []): array
    {
        return array_merge([
            'Authorization' => 'Bearer '.$this->supabaseStorageKey,
            'apikey' => $this->supabaseStorageKey,
        ], $headers);
    }

    private function isSupabaseConfigured(): bool
    {
        return '' !== trim($this->supabaseUrl)
            && '' !== trim($this->supabaseStorageKey)
            && '' !== trim($this->supabaseStorageBucket);
    }

    private function getSupabaseBaseUrl(): string
    {
        return rtrim($this->supabaseUrl, '/');
    }

    private function resolveSupabaseObjectPath(string $storedPath): ?string
    {
        if (!$this->isSupabaseConfigured()) {
            return null;
        }

        $publicPrefix = $this->getSupabaseBaseUrl().'/storage/v1/object/public/'.$this->supabaseStorageBucket.'/';

        if (!str_starts_with($storedPath, $publicPrefix)) {
            return null;
        }

        $objectPath = substr($storedPath, strlen($publicPrefix));

        return '' !== $objectPath ? $objectPath : null;
    }

    private function sanitizeFilename(string $filename, string $fallbackName): string
    {
        $safeName = preg_replace('/[^A-Za-z0-9_-]/', '-', $filename) ?: $fallbackName;
        $safeName = trim($safeName, '-_');

        return '' !== $safeName ? $safeName : $fallbackName;
    }

    private function getUploadErrorMessage(int $errorCode): string
    {
        return match ($errorCode) {
            \UPLOAD_ERR_INI_SIZE, \UPLOAD_ERR_FORM_SIZE => 'L image envoyee est trop lourde pour le serveur. Essaie un fichier plus leger.',
            \UPLOAD_ERR_PARTIAL => 'L image n a ete envoyee que partiellement. Reessaie l envoi.',
            \UPLOAD_ERR_NO_FILE => 'Aucune image n a ete envoyee. Selectionne une image puis reessaie.',
            \UPLOAD_ERR_NO_TMP_DIR => 'Le serveur ne trouve pas le dossier temporaire pour recevoir l image.',
            \UPLOAD_ERR_CANT_WRITE => 'Le serveur n a pas pu enregistrer l image envoyee.',
            \UPLOAD_ERR_EXTENSION => 'Une extension du serveur a bloque l envoi de l image.',
            default => 'Le fichier image envoye est invalide ou incomplet.',
        };
    }
}
