<?php

require_once(__DIR__ . '/utils.php');
require_once(__DIR__ . '/logging/logging.php');

function download_plugins($config): void {
    if (empty($config['downloadPlugins'])) {
        return;
    }

    h1('Downloading plugins...');
    foreach ($config['downloadPlugins'] as $plugin) {
        h2('Downloading plugin: ' . $plugin);
        run_bash_command("wp --allow-root plugin install {$plugin} --activate");
        passthru('chown -R www-data:www-data /var/www/html/wp-content/plugins/downloaded');
    }
}

function download_themes($config): void {
    if (empty($config['downloadThemes'])) {
        return;
    }

    h1('Downloading themes...');
    
    // Get list of existing themes before installation
    $themesDir = '/var/www/html/wp-content/themes';
    $existingThemes = [];
    if (is_dir($themesDir)) {
        $dirs = scandir($themesDir);
        foreach ($dirs as $dir) {
            if ($dir !== '.' && $dir !== '..' && is_dir($themesDir . '/' . $dir)) {
                $existingThemes[] = $dir;
            }
        }
    }
    
    // Install themes
    foreach ($config['downloadThemes'] as $theme) {
        h2('Downloading theme: ' . $theme);
        run_bash_command("wp --allow-root theme install {$theme}");
    }
    
    // Get list of themes after installation and only chown new ones
    $newThemes = [];
    if (is_dir($themesDir)) {
        $dirs = scandir($themesDir);
        foreach ($dirs as $dir) {
            if ($dir !== '.' && $dir !== '..' && is_dir($themesDir . '/' . $dir)) {
                if (!in_array($dir, $existingThemes)) {
                    $newThemes[] = $dir;
                }
            }
        }
    }
    
    // Only change permissions on newly installed themes
    foreach ($newThemes as $theme) {
        passthru('chown -R www-data:www-data ' . escapeshellarg($themesDir . '/' . $theme));
    }
}

function search_replace_urls($config): void {
    // Get current site URL from WordPress
    $siteurl = trim(shell_exec('wp --allow-root option get siteurl 2>/dev/null'));
    
    // Get target URL from environment variable or config
    $urlReplace = $config['configVariables']['SITE_URL']['value'];
    
    if (empty($siteurl) || empty($urlReplace)) {
        return;
    }
    
    if ($siteurl !== $urlReplace) {
        h2("Replacing URLs in database (replacing {$siteurl} with {$urlReplace})...");
        
        // Run search-replace and check exit code
        // wp search-replace returns 0 if replacements were made, non-zero if no changes
        $searchReplaceCmd = sprintf(
            'wp --allow-root search-replace --skip-columns=guid --report-changed-only --no-report %s %s 2>&1',
            escapeshellarg($siteurl),
            escapeshellarg($urlReplace)
        );
        
        $output = [];
        $exitCode = 0;
        exec($searchReplaceCmd, $output, $exitCode);
        
        // Log the output through logger
        if (!empty($output)) {
            logger(implode("\n", $output));
        }
        
        // If search-replace made changes (exit code 0), update the database
        if ($exitCode === 0) {
            h2('Updating database to apply URL changes...');
            run_bash_command('wp --allow-root core update-db');
        }
    }
}

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
            search_replace_urls($config);
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

function init($config) {
    // create downloaded plugins directory
    passthru('mkdir -p /var/www/html/wp-content/plugins/downloaded');

    // download plugins and themes
    download_plugins($config);
    download_themes($config);

    // import database from dumpfile if applicable
    configure_database($config);
}

$config = get_instance_config();
init($config);
