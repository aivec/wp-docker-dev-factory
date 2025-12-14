<?php

require_once(__DIR__ . '/utils.php');
require_once(__DIR__ . '/download_plugins.php');

function configure_database($config) {
    $flush_db_on_restart = isset($config['database']['flushOnRestart']) ? $config['database']['flushOnRestart'] : false;
    $dumpfile_path = $config['configVariables']['DOCKER_CONTAINER_DB_DUMPFILE_PATH']['value'];
    $container_status = $config['configVariables']['DOCKER_CONTAINER_STATUS']['value'];
    $import_dumpfile = $container_status === 'fresh' || ($container_status === 'restart' && $flush_db_on_restart === true);
    if (file_exists($dumpfile_path)) {
        if ($import_dumpfile) {
            if ($container_status === 'fresh') {
                h2("Starting container for the first time. Importing database from {$dumpfile_path} (this might take a while)...");
            }
            if ($container_status === 'restart' && $flush_db_on_restart === true) {
                h2("Flush on restart is enabled. Importing database from {$dumpfile_path} (this might take a while)...");
            }
            run_bash_command("wp --allow-root db drop --yes &> /dev/null");
            run_bash_command("wp --allow-root db create");
            run_bash_command("wp --allow-root db import {$dumpfile_path}");
        } else {
            h2("Flush on restart is disabled. Skipping import of {$dumpfile_path}...");
        }
    } else {
        if ($container_status === 'fresh') {
            h2("No dump file provided. Starting with fresh database...");
        }
        if ($container_status === 'restart') {
            h2("No dump file provided. Continuing with existing database...");
        }
    }
}

function configure_wordpress($config) {

    // create downloaded plugins directory
    passthru('mkdir -p /var/www/html/wp-content/plugins/downloaded');

    // download plugins and themes
    download_plugins();

    // import database from dumpfile if applicable
    configure_database($config);
}

$config = get_instance_config();
configure_wordpress($config);
