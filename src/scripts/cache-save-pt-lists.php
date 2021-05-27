#!/usr/bin/env php
<?php

require_once(__DIR__ . '/cache-utils.php');

// the cache dir is re-populated at the end of container startup
passthru('sudo rm -rf ' . $_ENV['AVC_CACHE_DIR']);
passthru('sudo mkdir -p ' . $_ENV['AVC_CACHE_DIR']);
passthru('sudo chown -R admin:admin ' . $_ENV['AVC_CACHE_DIR']);

$allplugins = [];
if (!empty($_ENV['DOWNLOAD_PLUGINS'])) {
    $downloadPlugins = json_decode($_ENV['DOWNLOAD_PLUGINS']);
    if (is_array($downloadPlugins)) {
        $allplugins = add_unique_slugs_and_return($allplugins, $downloadPlugins);
    }
}

$allthemes = [];
if (!empty($_ENV['DOWNLOAD_THEMES'])) {
    $downloadThemes = json_decode($_ENV['DOWNLOAD_THEMES']);
    if (is_array($downloadThemes)) {
        $allthemes = add_unique_slugs_and_return($allthemes, $downloadThemes);
    }
}

if (!empty($_ENV['SSH_CONFIGS'])) {
    $sshConfigs = json_decode($_ENV['SSH_CONFIGS'], true);
    if (is_array($sshConfigs)) {
        foreach ($sshConfigs as $config) {
            if (isset($config['plugins']) && is_array($config['plugins'])) {
                $allplugins = add_unique_slugs_and_return($allplugins, $config['plugins']);
            }
            if (isset($config['themes']) && is_array($config['themes'])) {
                $allthemes = add_unique_slugs_and_return($allthemes, $config['themes']);
            }
        }
    }
}

if (!empty($_ENV['FTP_CONFIGS'])) {
    $ftpConfigs = json_decode($_ENV['FTP_CONFIGS'], true);
    if (is_array($ftpConfigs)) {
        foreach ($ftpConfigs as $config) {
            if (isset($config['plugins']) && is_array($config['plugins'])) {
                $allplugins = add_unique_slugs_and_return($allplugins, $config['plugins']);
            }
            if (isset($config['themes']) && is_array($config['themes'])) {
                $allthemes = add_unique_slugs_and_return($allthemes, $config['themes']);
            }
        }
    }
}

file_put_contents(DOWNLOAD_PF, json_encode($allplugins));
file_put_contents(DOWNLOAD_TF, json_encode($allthemes));
