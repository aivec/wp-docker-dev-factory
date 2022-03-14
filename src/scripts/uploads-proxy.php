<?php

/**
 * Plugin Name: Aivec Uploads Folder Proxy
 * Description: This plugin proxies media requests to a user defined uploads URL
 * Author: Evan D Shaw
 * Version: 1.0.0
 * License: GPL2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if (empty($_ENV['AVC_UPLOADS_BASE_URL'])) {
    return;
}

add_filter('wp_get_attachment_image_src', 'avcufp_filter_wp_get_attachment_image_src');
add_filter('wp_calculate_image_srcset', 'avcufp_filter_wp_calculate_image_srcset');
add_filter('wp_get_attachment_url', 'avcufp_filter_wp_get_attachment_url');

/**
 * If image src does not exist locally, replaces src URL with value from
 * `$_ENV['AVC_UPLOADS_BASE_URL']`
 *
 * @param array $image
 * @return array
 */
function avcufp_filter_wp_get_attachment_image_src($image = []) {
    if (!is_array($image) || empty($image)) {
        return $image;
    }
    $wp_upload_dir = wp_upload_dir();
    $base_dir = $wp_upload_dir['basedir'];
    $base_url = $wp_upload_dir['baseurl'];
    $absolute_path = str_replace($base_url, $base_dir, $image[0]);
    if (file_exists($absolute_path)) {
        return $image;
    }
    $find = get_site_url();
    $replace = $_ENV['AVC_UPLOADS_BASE_URL'];
    $image[0] = str_replace($find, $replace, $image[0]);
    return $image;
}

/**
 * If srcset does not exist locally, replaces srcset URLs with value from
 * `$_ENV['AVC_UPLOADS_BASE_URL']`
 *
 * @param array $src
 * @return array
 */
function avcufp_filter_wp_calculate_image_srcset($src = []) {
    if (is_array($src)) {
        $wp_upload_dir = wp_upload_dir();
        $base_dir = $wp_upload_dir['basedir'];
        $base_url = $wp_upload_dir['baseurl'];
        $find = get_site_url();
        $replace = $_ENV['AVC_UPLOADS_BASE_URL'];
        foreach ($src as $key => $val) {
            $absolute_path = str_replace($base_url, $base_dir, $val['url']);
            if (!file_exists($absolute_path)) {
                $val['url'] = str_replace($find, $replace, $val['url']);
                $src[$key] = $val;
            }
        }
    }
    return $src;
}

/**
 * If image does not exist locally, replaces attachment URL with value from
 * `$_ENV['AVC_UPLOADS_BASE_URL']`
 *
 * @param string $url
 * @return string
 */
function avcufp_filter_wp_get_attachment_url($url = '') {
    $wp_upload_dir = wp_upload_dir();
    $base_dir = $wp_upload_dir['basedir'];
    $base_url = $wp_upload_dir['baseurl'];
    $find = get_site_url();
    $replace = $_ENV['AVC_UPLOADS_BASE_URL'];
    $absolute_path = str_replace($base_url, $base_dir, $url);
    if (!file_exists($absolute_path)) {
        $url = str_replace($find, $replace, $url);
    }
    return $url;
}
