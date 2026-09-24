<?php

// Cron strips container environment variables; restore them without logging secrets.
foreach (explode("\0", file_get_contents('/proc/1/environ')) as $entry) {
    if (str_contains($entry, '=')) {
        putenv($entry);
    }
}

$allowed = ['app:promotions:expire', 'app:promotions:reconcile-payments'];
$command = $argv[1] ?? '';
if (!in_array($command, $allowed, true)) {
    exit(1);
}

chdir('/var/www/api');
passthru('/usr/local/bin/php bin/console '.escapeshellarg($command).' --no-interaction', $status);
exit($status);
