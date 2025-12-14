<?php

require_once(__DIR__ . '/utils.php');
require_once(__DIR__ . '/logging/logging.php');

function download_plugins(): void {
    $instanceConfig = get_instance_config();
    if (empty($instanceConfig['downloadPlugins'])) {
        return;
    }

    h1('Downloading plugins...');
    foreach ($instanceConfig['downloadPlugins'] as $plugin) {
        h2('Downloading plugin: ' . $plugin);
        run_bash_command("wp --allow-root plugin install {$plugin} --activate");
        passthru('chown -R www-data:www-data /var/www/html/wp-content/plugins/downloaded');
    }
}