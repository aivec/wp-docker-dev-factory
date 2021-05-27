#!/bin/bash

# PHP doesnt seem to pick up on environment variables when started via apache so we
# have to explicitly list them for apache
if [[ ! -z ${APACHE_ENV_VARS} ]]; then
    sudo sed -i '/^#start-avc-envvars/,$d' /etc/apache2/envvars
    echo "#start-avc-envvars" | sudo tee -a /etc/apache2/envvars >/dev/null
    echo $APACHE_ENV_VARS | jq -r 'keys[]' | while read key; do
        val=$(echo $APACHE_ENV_VARS | jq -r ".[\"$key\"]")
        sudo sed -i "/^export\s${key}/d" /etc/apache2/envvars
        echo "export ${key}=${val}" | sudo tee -a /etc/apache2/envvars >/dev/null
    done
fi
