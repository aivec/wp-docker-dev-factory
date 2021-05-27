<?php

define('DOWNLOAD_PF', $_ENV['AVC_CACHE_DIR'] . '/download-plugins.json');
define('DOWNLOAD_TF', $_ENV['AVC_CACHE_DIR'] . '/download-themes.json');

/**
 * Returns the slug name of a plugin/theme given a path
 *
 * @author Evan D Shaw <evandanielshaw@gmail.com>
 * @param string $path
 * @return string
 */
function get_slug_from_path($path) {
    // get slug name from path
    $pieces = explode('/', $path);
    $slug = $pieces[count($pieces) - 1];

    // trim whitespace
    $slug = trim($slug);

    // remove .zip from end of name if it exists
    $pieces = explode('.', $slug);
    $name = $pieces[count($pieces) - 1];
    if (count($pieces) > 1) {
        if (strtolower($name) === 'zip') {
            unset($pieces[count($pieces) - 1]);
        }
        $name = join('.', $pieces);
    }

    return $name;
}

/**
 * Given a path to a plugin/theme folder or zip file, this function extracts the slug name, strips `.zip`
 * if present, appends the slug to `$appendto` if it is unique, then returns `$appendto`
 *
 * @author Evan D Shaw <evandanielshaw@gmail.com>
 * @param array $appendto
 * @param array $items
 * @return array
 */
function add_unique_slugs_and_return(array $appendto, array $items) {
    if (!empty($items)) {
        foreach ($items as $path) {
            $name = get_slug_from_path($path);
            if (!empty($name)) {
                if (!in_array($name, $appendto, true)) {
                    $appendto[] = $name;
                }
            }
        }
    }

    return $appendto;
}

/**
 * Returns `true` if the provided plugin should be installed, `false` otherwise
 *
 * @author Evan D Shaw <evandanielshaw@gmail.com>
 * @param string $p
 * @return bool
 */
function should_install_plugin($p) {
    $slug = get_slug_from_path($p);
    if (empty($slug)) {
        return false;
    }

    if (!file_exists(DOWNLOAD_PF)) {
        return true;
    }

    $allplugins = file_get_contents(DOWNLOAD_PF);
    if (empty($allplugins)) {
        return true;
    }

    $allplugins = json_decode($allplugins);
    if (empty($allplugins)) {
        return true;
    }

    if (in_array($slug, $allplugins, true)) {
        return false;
    }

    return true;
}

/**
 * Returns `true` if the provided theme should be installed, `false` otherwise
 *
 * @author Evan D Shaw <evandanielshaw@gmail.com>
 * @param string $p
 * @return bool
 */
function should_install_theme($p) {
    $slug = get_slug_from_path($p);
    if (empty($slug)) {
        return false;
    }

    if (!file_exists(DOWNLOAD_TF)) {
        return true;
    }

    $allthemes = file_get_contents(DOWNLOAD_TF);
    if (empty($allthemes)) {
        return true;
    }

    $allthemes = json_decode($allthemes);
    if (empty($allthemes)) {
        return true;
    }

    if (in_array($slug, $allthemes, true)) {
        return false;
    }

    return true;
}
