<?php

$host = 'db'; // mysql container
$user = $argv[1];
$pass = $argv[2];
$database = $argv[3];
$dir = $argv[4];
exec(
    'mysqldump --user=' . $user . ' --password=' . $pass . ' --host=' . $host . ' ' . $database . ' --result-file=' . $dir . ' 2>&1',
    $output
);
if (!empty($output)) {
    echo $output[0];
}
