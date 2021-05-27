#!/bin/bash

source ${AVC_SCRIPTS_DIR}/logging.sh

sshheadershown=0

setup_ssh_config() {
    rm -f ~/.ssh/config
    mkdir -p ~/.ssh
    touch ~/.ssh/config
    echo -e "
    AddKeysToAgent yes
    StrictHostKeyChecking no
    IdentitiesOnly yes
    " >~/.ssh/config
}

append_host_to_ssh_config() {
    jsonconf=$1
    confname=$(echo $jsonconf | jq -r '.["confname"]')
    host=$(echo $jsonconf | jq -r '.["host"]')
    user=$(echo $jsonconf | jq -r '.["user"]')
    plugins=$(echo $jsonconf | jq -r '.["plugins"]')
    themes=$(echo $jsonconf | jq -r '.["themes"]')
    privateKeyFilename=$(echo $jsonconf | jq -r '.["privateKeyFilename"]')
    privateKeyPath="${AVC_SSH_DIR}/$privateKeyFilename"
    chmod 600 $privateKeyPath

    echo -e "
    Host ${confname}
        HostName ${host}
        Port 22
        User ${user}
        IdentityFile ${privateKeyPath}
    " >>~/.ssh/config
}

download_and_install_ssh_pts() {
    wpcommand=$1
    tempdir=$2
    dpaths=$3
    confname=$4

    if [ "$dpaths" != "null" ] && [ ! -z "$dpaths" ]; then
        pathcount=$(echo $dpaths | jq -r '. | length')
        if [ $pathcount -gt 0 ]; then
            mkdir -p $tempdir
            pathi=0
            while [ $pathi -lt $pathcount ]; do
                path=$(echo $dpaths | jq -r --arg index "$pathi" '.[$index | tonumber]')
                ${AVC_SCRIPTS_DIR}/cache-should-install-${wpcommand}.php "$path"
                if [ $? -eq 0 ]; then
                    if [ $sshheadershown -eq 0 ]; then
                        h2 "Pulling plugins/themes from SSH server (this might take a while)..."
                        sshheadershown=1
                    fi
                    file="$path.zip"
                    echo Downloading $file |& logger
                    scp $confname:$file $tempdir
                    if [ $? -eq 0 ]; then
                        wp $wpcommand install $tempdir/*.zip |& logger
                        rm $tempdir/*.zip
                    fi
                fi
                pathi=$(($pathi + 1))
            done
            rm -rf $tempdir
        fi
    fi
}

if [[ ! -z ${SSH_CONFIGS} ]]; then
    configcount=$(echo $SSH_CONFIGS | jq -r '. | length')
    if [ $configcount -lt 1 ]; then
        return
    fi

    setup_ssh_config

    mkdir -p ${AVC_TEMP_DIR}
    configi=0
    while [ $configi -lt $configcount ]; do
        config=$(echo $SSH_CONFIGS | jq -r --arg index "$configi" '.[$index | tonumber]')
        confname=$(echo $config | jq -r '.["confname"]')

        append_host_to_ssh_config "$config"

        # download and install plugins
        plugins=$(echo $config | jq -r '.["plugins"]')
        temppdir=${AVC_TEMP_DIR}/plugins
        download_and_install_ssh_pts "plugin" "$temppdir" "$plugins" "$confname"

        # download and install themes
        themes=$(echo $config | jq -r '.["themes"]')
        temptdir=${AVC_TEMP_DIR}/themes
        download_and_install_ssh_pts "theme" "$temptdir" "$themes" "$confname"

        configi=$(($configi + 1))
    done
    rm -rf ${AVC_TEMP_DIR}
fi
