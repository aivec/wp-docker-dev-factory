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

# setting the XDEBUG_CONFIG environment variable doesn't seem to work so we hardcode it here
sudo sh -c "echo 'xdebug.remote_host=${DOCKER_BRIDGE_IP}' >> /usr/local/etc/php/conf.d/xdebug.ini"

# PHP doesnt seem to pick up on environment variables when started via apache so we
# have to explicitly list them for apache
echo "export AVC_NODE_ENV=${AVC_NODE_ENV}" | sudo tee -a /etc/apache2/envvars >/dev/null

h2 "Installing and activating Japanese language pack."
wp language core install ja |& logger
wp site switch-language ja |& logger

if [[ ! -z ${FTP_CONFIGS} ]]; then
    h2 "Pulling non-free plugins/themes from FTP server via lftp. This may take some time..."
    configcount=$(echo $FTP_CONFIGS | jq -r '. | length')
    configcount=$(($configcount - 1))
    configi=0
    while [ $configi -le $configcount ]; do
        config=$(echo $FTP_CONFIGS | jq -r --arg index "$configi" '.[$index | tonumber]')
        host=$(echo $config | jq -r '.["host"]')
        user=$(echo $config | jq -r '.["user"]')
        password=$(echo $config | jq -r '.["password"]')
        plugins=$(echo $config | jq -r '.["plugins"]')
        themes=$(echo $config | jq -r '.["themes"]')

        if [ "$plugins" != "null" ] && [ ! -z "$plugins" ]; then
            plugincount=$(echo $plugins | jq -r '. | length')
            plugincount=$(($plugincount - 1))
            plugini=0
            mkdir -p plugins && cd plugins
            while [ $plugini -le $plugincount ]; do
                path=$(echo $plugins | jq -r --arg index "$plugini" '.[$index | tonumber]')
                file="$path.zip"
                lftp -c "open -u $user,$password $host; mget ${file};"
                plugini=$(($plugini + 1))
            done
            cd ../
            cp -a plugins/. /app/wp-content/plugins/
        fi

        if [ "$themes" != "null" ] && [ ! -z "$themes" ]; then
            themecount=$(echo $themes | jq -r '. | length')
            themecount=$(($themecount - 1))
            themei=0
            mkdir -p themes && cd themes
            while [ $themei -le $themecount ]; do
                path=$(echo $themes | jq -r --arg index "$themei" '.[$index | tonumber]')
                file="$path.zip"
                lftp -c "open -u $user,$password $host; mget ${file};"
                themei=$(($themei + 1))
            done
            cd ../
            cp -a themes/. /app/wp-content/themes/
        fi

        configi=$(($configi + 1))
    done

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
fi
