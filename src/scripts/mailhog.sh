#!/bin/bash

wp plugin is-installed mailhog
if [ $? -eq 1 ]; then
    mkdir -p /app/wp-content/plugins/mailhog
    mv ${AVC_SCRIPTS_DIR}/mailhog.php /app/wp-content/plugins/mailhog/
    wp plugin activate mailhog |& logger
else
    wp plugin is-active mailhog
    if [ $? -eq 1 ]; then
        wp plugin activate mailhog |& logger
    fi
fi
