#!/usr/bin/env php
<?php

require_once(__DIR__ . '/cache-utils.php');

$themename = $argv[1];
$result = should_install_theme($themename);
if ($result === false) {
    exit(1);
}
