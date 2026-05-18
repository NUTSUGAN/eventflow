<?php

function eventflowRuntimeRootPath(string $relativePath = ''): string
{
    $rootPath = dirname(__DIR__);

    if ('' === $relativePath) {
        return $rootPath;
    }

    return $rootPath.'/'.ltrim($relativePath, '/');
}

function eventflowRuntimeDirectories(): array
{
    return [
        eventflowRuntimeRootPath('var'),
        eventflowRuntimeRootPath('var/cache'),
        eventflowRuntimeRootPath('var/cache/dev'),
        eventflowRuntimeRootPath('var/cache/dev/profiler'),
        eventflowRuntimeRootPath('var/cache/dev/doctrine'),
        eventflowRuntimeRootPath('var/cache/dev/doctrine/orm'),
        eventflowRuntimeRootPath('var/cache/dev/doctrine/orm/Proxies'),
        eventflowRuntimeRootPath('var/log'),
    ];
}

function eventflowEnsureRuntimeDirectories(): void
{
    foreach (eventflowRuntimeDirectories() as $directoryPath) {
        if (!is_dir($directoryPath)) {
            @mkdir($directoryPath, 0775, true);
        }

        if (is_dir($directoryPath)) {
            @chmod($directoryPath, 0775);
        }
    }
}

function eventflowRepairRuntimeOwnership(): void
{
    if (!function_exists('posix_geteuid') || 0 !== posix_geteuid()) {
        return;
    }

    if (!function_exists('posix_getpwnam') || !function_exists('posix_getgrnam')) {
        return;
    }

    $userInfo = posix_getpwnam('www-data');
    $groupInfo = posix_getgrnam('www-data');

    if (!is_array($userInfo) || !isset($userInfo['uid']) || !is_array($groupInfo) || !isset($groupInfo['gid'])) {
        return;
    }

    $runtimeRoot = eventflowRuntimeRootPath('var');

    if (!is_dir($runtimeRoot)) {
        return;
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($runtimeRoot, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    @chown($runtimeRoot, (int) $userInfo['uid']);
    @chgrp($runtimeRoot, (int) $groupInfo['gid']);
    @chmod($runtimeRoot, 0775);

    foreach ($iterator as $item) {
        $path = $item->getPathname();

        @chown($path, (int) $userInfo['uid']);
        @chgrp($path, (int) $groupInfo['gid']);
        @chmod($path, $item->isDir() ? 0775 : 0664);
    }
}

function eventflowPrepareRuntime(bool $repairOwnership = false): void
{
    eventflowEnsureRuntimeDirectories();

    if ($repairOwnership) {
        eventflowRepairRuntimeOwnership();
    }
}
