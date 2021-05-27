#!/bin/bash

source ${AVC_SCRIPTS_DIR}/logging.sh

download_and_install_pts() {
    wpcommand=$1
    slugs=$2

    if [ "$slugs" != "null" ] && [ ! -z "$slugs" ]; then
        pathcount=$(echo $slugs | jq -r '. | length')
        if [ $pathcount -gt 0 ]; then
            i=0
            while [ $i -lt $pathcount ]; do
                slug=$(echo $slugs | jq -r --arg index "$i" '.[$index | tonumber]')
                ${AVC_SCRIPTS_DIR}/cache-should-install-${wpcommand}.php "$slug"
                if [ $? -eq 0 ]; then
                    wp $wpcommand install $slug |& logger
                fi
                i=$(($i + 1))
            done
        fi
    fi
}

if [ $RUNNING_FROM_CACHE -eq 1 ]; then
    if [[ ! -z ${DOWNLOAD_THEMES} ]]; then
        # download and install themes
        h2 "Checking themes..."
        download_and_install_pts "theme" "$DOWNLOAD_THEMES"
    fi
    if [[ ! -z ${DOWNLOAD_PLUGINS} ]]; then
        # download and install plugins
        h2 "Checking plugins..."
        download_and_install_pts "plugin" "$DOWNLOAD_PLUGINS"
    fi
fi
