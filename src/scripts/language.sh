#!/bin/bash

source ${AVC_SCRIPTS_DIR}/logging.sh 

wp language core is-installed ${WP_LOCALE}
if [ $? -eq 1 ]; then
    h2 "Setting site language to ${WP_LOCALE}"
    wp language core install ${WP_LOCALE} |& logger
fi

wp site switch-language ${WP_LOCALE} |& logger
