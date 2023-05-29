#!/bin/bash

source ${AVC_SCRIPTS_DIR}/logging.sh

ftpheadershown=0

download_and_install_ftp_pts() {
    wpcommand=$1
    tempdir=$2
    dpaths=$3
    config=$4

    host=$(echo $config | jq -r '.["host"]')
    user=$(echo $config | jq -r '.["user"]')
    password=$(echo $config | jq -r '.["password"]')

    if [ "$dpaths" != "null" ] && [ ! -z "$dpaths" ]; then
        pathcount=$(echo $dpaths | jq -r '. | length')
        if [ $pathcount -gt 0 ]; then
            mkdir -p $tempdir
            pushd $tempdir
            pathi=0
            while [ $pathi -lt $pathcount ]; do
                path=$(echo $dpaths | jq -r --arg index "$pathi" '.[$index | tonumber]')
                ${AVC_SCRIPTS_DIR}/cache-should-install-${wpcommand}.php "$path"
                if [ $? -eq 0 ]; then
                    if [ $ftpheadershown -eq 0 ]; then
                        h2 "Pulling plugins/themes from FTP server (this might take a while)..."
                        ftpheadershown=1
                    fi
                    file="$path.zip"
                    echo Downloading $file |& logger
                    lftp -c "open -u $user,$password $host;set ftp:ssl-allow no;set ftp:passive-mode true;set ssl:verify-certificate no; mget ${file};"
                    if [ $? -eq 0 ]; then
                        wp $wpcommand install $tempdir/*.zip |& logger
                        rm $tempdir/*.zip
                    fi
                fi
                pathi=$(($pathi + 1))
            done
            popd
            rm -rf $tempdir
        fi
    fi
}

if [[ ! -z ${FTP_CONFIGS} ]]; then
    configcount=$(echo $FTP_CONFIGS | jq -r '. | length')
    if [ $configcount -gt 0 ]; then
        mkdir -p ${AVC_TEMP_DIR}
        configi=0
        while [ $configi -lt $configcount ]; do
            config=$(echo $FTP_CONFIGS | jq -r --arg index "$configi" '.[$index | tonumber]')

            # download and install plugins
            plugins=$(echo $config | jq -r '.["plugins"]')
            temppdir=${AVC_TEMP_DIR}/plugins
            download_and_install_ftp_pts "plugin" "$temppdir" "$plugins" "$config"

            # download and install themes
            themes=$(echo $config | jq -r '.["themes"]')
            temptdir=${AVC_TEMP_DIR}/themes
            download_and_install_ftp_pts "theme" "$temptdir" "$themes" "$config"

            configi=$(($configi + 1))
        done
        rm -rf ${AVC_TEMP_DIR}
    fi
fi
