#!/bin/bash

source ${AVC_SCRIPTS_DIR}/logging.sh

if [[ -e ${AVC_USER_SCRIPTS_DIR} ]]; then
    h2 "Executing custom user scripts..."
    for file in ${AVC_USER_SCRIPTS_DIR}/*; do
        [[ -x $file ]] && "$file"
    done
fi
