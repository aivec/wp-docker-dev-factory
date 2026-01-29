<?php

function get_instance_config(): array {
    return json_decode(file_get_contents('/wp-docker/instance-config.json'), true);
}

function run_bash_command($command): void {
    $config = get_instance_config();
    $scriptsDir = $config['configVariables']['DOCKER_CONTAINER_SCRIPTS_DIR']['value'];
    passthru("/bin/bash -c 'source {$scriptsDir}/logging/logging.sh && {$command} |& logger'");
}