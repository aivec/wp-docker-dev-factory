<?php
if (!function_exists('getenv_docker')) {
	// https://github.com/docker-library/wordpress/issues/588 (WP-CLI will load this file 2x)
	function getenv_docker($env, $default) {
		if ($fileEnv = getenv($env . '_FILE')) {
			return rtrim(file_get_contents($fileEnv), "\r\n");
		}
		else if (($val = getenv($env)) !== false) {
			return $val;
		}
		else {
			return $default;
		}
	}
}
$host = getenv_docker('WORDPRESS_DB_HOST', 'mysql');
$username = getenv_docker('WORDPRESS_DB_USER', 'example username');
$password = getenv_docker('WORDPRESS_DB_PASSWORD', 'example password');
$database = getenv_docker('WORDPRESS_DB_NAME', 'wordpress');

$mysqli = new mysqli($host, $username, $password, $database);

if ($mysqli->connect_error) {
    fwrite(STDERR, "Connection failed: " . $mysqli->connect_error . PHP_EOL);
    exit(1);
}

echo "Connected successfully." . PHP_EOL;
$mysqli->close();
