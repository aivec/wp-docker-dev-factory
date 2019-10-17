#!/bin/bash

declare -i term_width=70

h2() {
    printf '\e[1;33m==>\e[37;1m %s\e[0m\n' "$*"
}

logger() {
    fold --width $((term_width - 9)) -s | sed -n '
    /^\x1b\[[0-9;]*m/{ # match any line beginning with colorized text
        s/Error:/  \0/ # pads line so its length matches others
        p              # any lines containing color
        b              # branch to end
    }
    s/.*/         \0/p # pads all other lines with 9 spaces
    '
}

# setting the XDEBUG_CONFIG environment variable doesn't seem to work so we hardcode here
sudo sh -c "echo 'xdebug.remote_host=${DOCKER_BRIDGE_IP}' >> /usr/local/etc/php/conf.d/xdebug.ini"

h2 "Installing and activating Japanese language pack."
wp language core install ja |& logger
wp site switch-language ja |& logger

if [ "$PROPRIETARY_DOWNLOAD" = "true" ]; then
    IFS=',' read -ra FTP_PLUGINS_FULLPATHS <<<"$DLPROP_PLUGINS_FULLPATHS"
    IFS=',' read -ra FTP_THEMES_FULLPATHS <<<"$DLPROP_THEMES_FULLPATHS"

    h2 "Pulling non-free plugins/themes from proprietary FTP server via lftp. This may take some time..."
    mkdir -p plugins && cd plugins
    for path in "${FTP_PLUGINS_FULLPATHS[@]}"; do
        lftp -c "open -u $PROPRIETARY_FTPUSER,$PROPRIETARY_FTPPASSWORD $PROPRIETARY_FTPHOST; mget ${path};"
    done
    cd ../
    cp -a plugins/. /app/wp-content/plugins/

    mkdir -p themes && cd themes
    for path in "${FTP_THEMES_FULLPATHS[@]}"; do
        lftp -c "open -u $PROPRIETARY_FTPUSER,$PROPRIETARY_FTPPASSWORD $PROPRIETARY_FTPHOST; mget ${path};"
    done
    cd ../
    cp -a themes/. /app/wp-content/themes/

    cd /app/wp-content/plugins
    plugins=($(find . -maxdepth 1 -name '*.zip'))
    echo "Extracting downloaded plugins..." |& logger
    for zipfile in "${plugins[@]}"; do
        echo "Extracting $zipfile" |& logger
        unzip -q "$zipfile"
        rm "$zipfile"
    done

    cd /app/wp-content/themes
    themes=($(find . -maxdepth 1 -name '*.zip'))
    echo "Extracting downloaded themes..." |& logger
    for zipfile in "${themes[@]}"; do
        echo "Extracting $zipfile" |& logger
        unzip -q "$zipfile"
        rm "$zipfile"
    done
else
    echo "No proprietary plugins/themes specified for install. Skipping" |& logger
fi

if [ "$SSL_ENABLED" = "true" ]; then
    h2 "Pointing WP_SITEURL and WP_HOME to \$_SERVER globals for ngrok"
    echo "run \"ngrok http localhost:${DOCKER_CONTAINER_PORT}\" to tunnel through https" |& logger
    # append these lines to wp-config.php for ngrok to work
    sed -i '/all, stop editing!/ a define("WP_SITEURL", "http://" . $_SERVER["HTTP_HOST"]);' /app/wp-config.php
    sed -i '/all, stop editing!/ a define("WP_HOME", "http://" . $_SERVER["HTTP_HOST"]);' /app/wp-config.php
    wp plugin activate relative-url
else
    wp plugin deactivate relative-url
fi
