<?php
$host = 'db'; // mysql container
$user = $argv[1];
$password = $argv[2];
$database = $argv[3];
$dbprefix = $argv[4];

$mysqli = new mysqli($host, $user, $password, $database);
if ($mysqli->connect_errno) {
    echo 'Failed to connect to MySQL: (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error;
}

$options = $dbprefix . 'options';
$res = $mysqli->query('SELECT option_value FROM ' . $options . ' WHERE option_name = "active_plugins";');
if ($res === false) {
    echo '';
    exit(1);
}
$res = $res->fetch_assoc();
$resarr = unserialize($res['option_value']);
foreach ($resarr as &$pluginstring) {
    $pieces = explode('/', $pluginstring);
    $pluginstring = $pieces[0];
}
echo json_encode($resarr);
