#!/bin/bash

wp plugin is-installed uploads-proxy
if [ $? -eq 1 ]; then
    mkdir -p /app/wp-content/plugins/uploads-proxy
    mv ${AVC_SCRIPTS_DIR}/uploads-proxy.php /app/wp-content/plugins/uploads-proxy/
fi

if [[ ! -z "${AVC_UPLOADS_BASE_URL}" ]]; then
    wp plugin is-active uploads-proxy
    if [ $? -eq 1 ]; then
        wp plugin activate uploads-proxy |& logger
    fi
fi
