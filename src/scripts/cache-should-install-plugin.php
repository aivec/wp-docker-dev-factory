#!/usr/bin/env php
<?php

require_once(__DIR__ . '/cache-utils.php');

$pluginname = $argv[1];
$result = should_install_plugin($pluginname);
if ($result === false) {
    exit(1);
}
