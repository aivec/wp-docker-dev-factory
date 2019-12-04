#!/bin/bash

RED='\033[1;31m'
GREEN='\033[1;32m'
CYAN='\033[1;36m'
WHITE='\033[1;37m'
YELLOW='\e[33m'
NC='\033[0m'

INFO="${CYAN}[info]${NC}"
WARN="${YELLOW}[warning]${NC}"
FATAL="${RED}[fatal]${NC}"

NETWORK_NAME=wp-dev-instances

if [ ! -f wp-instances.json ]; then
    echo -e "${INFO} ${WHITE}${YELLOW}wp-instances.json${WHITE} must be in the root of this project. Refer to the file in the ${WHITE}${YELLOW}examples${WHITE} folder." >&2
    exit 1
fi

command -v docker >/dev/null 2>&1 || {
    echo -e "${FATAL} ${WHITE}${YELLOW}docker${WHITE} is either not installed or not in your PATH. ${YELLOW}docker${WHITE} is required for the Wordpress container. https://docs.docker.com/install/" >&2
    exit 1
}
command -v docker-compose >/dev/null 2>&1 || {
    echo -e "${FATAL} ${WHITE}${YELLOW}docker-compose${WHITE} is either not installed or not in your PATH. ${YELLOW}docker-compose${WHITE} is required for the MySQL and phpmyadmin containers. https://docs.docker.com/compose/install/" >&2
    exit 1
}
command -v jq >/dev/null 2>&1 || {
    echo -e "${FATAL} ${WHITE}${YELLOW}jq${WHITE} is either not installed or not in your PATH. ${YELLOW}jq${WHITE} is required to parse the JSON config file. https://stedolan.github.io/jq/download" >&2
    exit 1
}

runContainer() {
    i=$1 # config index

    config=$(cat wp-instances.json | jq -r --arg index "$i" '.[$index | tonumber]')
    project_name=$(echo $config | jq -r '.["project-name"]')
    WP_PORT=$(echo $config | jq -r '.["container-port"]')
    DOWNLOAD_PLUGINS=$(echo $config | jq -r '.["download-plugins"]')

    # proprietary plugins and themes data
    SSL_ENABLED=$(echo $config | jq -r '.["ssl"]')
    PROPRIETARY_DOWNLOAD=$(echo $config | jq -r '.["download-proprietary-plugins-themes"]')
    DLPROP_PLUGINS=$(echo $config | jq -r '.["proprietary-plugin-zipfiles"]')
    DLPROP_PLUGINS_PATH=$(echo $config | jq -r '.["proprietery-pluginspath"]')
    DLPROP_THEMES=$(echo $config | jq -r '.["proprietary-theme-zipfiles"]')
    DLPROP_THEMES_PATH=$(echo $config | jq -r '.["proprietery-themespath"]')
    PROPRIETARY_FTPHOST=$(echo $config | jq -r '.["proprietary-ftphost"]')
    PROPRIETARY_FTPUSER=$(echo $config | jq -r '.["proprietary-ftpuser"]')
    PROPRIETARY_FTPPASSWORD=$(echo $config | jq -r '.["proprietary-ftppassword"]')
    PROPRIETARY_PLUGINSPATH=$(echo $config | jq -r '.["proprietary-pluginspath"]')
    PROPRIETARY_THEMESPATH=$(echo $config | jq -r '.["proprietary-themespath"]')

    # proprietary plugins list construction
    propplugincount=$(echo $DLPROP_PLUGINS | jq -r '. | length')
    propplugincount=$(($propplugincount - 1))
    proppluginsfull=()
    plugini=0
    while [ $plugini -le $propplugincount ]; do
        pname=$(echo $DLPROP_PLUGINS | jq -r --arg index "$plugini" '.[$index | tonumber]')
        fl="$PROPRIETARY_PLUGINSPATH/$pname.zip"
        proppluginsfull+=("$fl")
        plugini=$(($plugini + 1))
    done
    printf -v DLPROP_PLUGINS_FULLPATHS ',%s' "${proppluginsfull[@]}"
    DLPROP_PLUGINS_FULLPATHS=${DLPROP_PLUGINS_FULLPATHS:1}

    # proprietary themes list construction
    propthemecount=$(echo $DLPROP_THEMES | jq -r '. | length')
    propthemecount=$(($propthemecount - 1))
    propthemesfull=()
    themei=0
    while [ $themei -le $propthemecount ]; do
        tname=$(echo $DLPROP_THEMES | jq -r --arg index "$themei" '.[$index | tonumber]')
        fl="$PROPRIETARY_PLUGINSPATH/$pname.zip"
        propthemesfull+=($PROPRIETARY_THEMESPATH/$tname.zip)
        themei=$(($themei + 1))
    done
    printf -v DLPROP_THEMES_FULLPATHS ',%s' "${propthemesfull[@]}"
    DLPROP_THEMES_FULLPATHS=${DLPROP_THEMES_FULLPATHS:1}

    # free plugins list construction
    downloadplugincount=$(echo $DOWNLOAD_PLUGINS | jq -r '. | length')
    downloadplugincount=$(($downloadplugincount - 1))
    downloadplugins=()
    plugini=0
    while [ $plugini -le $downloadplugincount ]; do
        downloadplugins+=($(echo $DOWNLOAD_PLUGINS | jq -r --arg index "$plugini" '.[$index | tonumber]'))
        plugini=$(($plugini + 1))
    done
    # used for ngrok
    downloadplugins+=(relative-url)

    printf -v DOWNLOAD_PLUGINS ',%s' "${downloadplugins[@]}"
    DOWNLOAD_PLUGINS=${DOWNLOAD_PLUGINS:1}

    DB_CONTAINER_NAME=${project_name}_dev_db
    PMA_CONTAINER_NAME=${project_name}_dev_pma
    WP_CONTAINER_NAME=${project_name}_dev_wp
    PROJECT_NAME=$project_name

    if [ -z $WP_PORT ]; then
        WP_PORT=$((8000 + $i))
    fi

    volumes=()
    plugincount=$(echo $config | jq -r '.["local-plugins"] | length')
    plugincount=$(($plugincount - 1))
    plugini=0
    while [ $plugini -le $plugincount ]; do
        ppath=$(echo $config | jq -r --arg index "$plugini" '.["local-plugins"][$index | tonumber]')
        if [ -d $ppath ]; then
            pbasename=${ppath##*/}
            volumes+=(-v $ppath:/app/wp-content/plugins/$pbasename)
        else
            printf "${WARN} ${WHITE}Local plugin folder at ${CYAN}${ppath}${WHITE} doesn't exist. Skipping volume mount.${NC}\n"
        fi
        plugini=$(($plugini + 1))
    done

    themecount=$(echo $config | jq -r '.["local-themes"] | length')
    themecount=$(($themecount - 1))
    themei=0
    while [ $themei -le $themecount ]; do
        tpath=$(echo $config | jq -r --arg index "$themei" '.["local-themes"][$index | tonumber]')
        if [ -d $tpath ]; then
            tbasename=${tpath##*/}
            volumes+=(-v $tpath:/app/wp-content/themes/$tbasename)
        else
            printf "${WARN} ${WHITE}Local theme folder at ${CYAN}${tpath}${WHITE} doesn't exist. Skipping volume mount.${NC}\n"
        fi
        themei=$(($themei + 1))
    done

    mysqldump=$(echo $config | jq -r '.["mysql-dumpfile"]')
    if [ ! -z $mysqldump ]; then
        if [ -e $mysqldump ]; then
            volumes+=(-v $mysqldump:/data/db.sql)
        else
            printf "${WARN} ${WHITE}Local MySQL dump file at ${CYAN}${mysqldump}${WHITE} doesn't exist. Skipping volume mount.${NC}\n"
        fi
    fi

    PLUGINS="${downloadplugins[*]}"
    volumes+=(-v $(pwd)/initwp.sh:/docker-entrypoint-initwp.d/initwp.sh)
    volumes+=(-v $(pwd)/redump.php:/app/redump.php)
    volumes+=(-v $(pwd)/dumpfiles:/app/dumpfiles)

    v=${volumes[@]}
    NEW_URL=http://localhost:${WP_PORT}
    DOCKER_BRIDGE_IP=$(docker network inspect bridge -f '{{ (index .IPAM.Config 0).Gateway }}')

    docker run -d --name=${WP_CONTAINER_NAME} -p ${WP_PORT}:80 -p 443:443 \
        --cap-add=SYS_ADMIN \
        --device=/dev/fuse \
        --security-opt apparmor=unconfined \
        ${v} \
        --env PLUGINS="$PLUGINS" \
        --env XDEBUG_CONFIG=remote_host=${DOCKER_BRIDGE_IP} \
        --env ENVIRONMENT=development \
        --env AVC_NODE_ENV=development \
        --env DOCKER_BRIDGE_IP=${DOCKER_BRIDGE_IP} \
        --env DOCKER_CONTAINER_PORT=${WP_PORT} \
        --env URL_REPLACE=${NEW_URL} \
        --env DB_HOST=aivec_wp_mysql \
        --env DB_NAME=${PROJECT_NAME} \
        --env DOWNLOAD_PLUGINS=${DOWNLOAD_PLUGINS} \
        --env SSL_ENABLED=${SSL_ENABLED} \
        --env PROPRIETARY_DOWNLOAD=${PROPRIETARY_DOWNLOAD} \
        --env DLPROP_PLUGINS_FULLPATHS=${DLPROP_PLUGINS_FULLPATHS} \
        --env DLPROP_THEMES_FULLPATHS=${DLPROP_THEMES_FULLPATHS} \
        --env PROPRIETARY_FTPHOST=${PROPRIETARY_FTPHOST} \
        --env PROPRIETARY_FTPUSER=${PROPRIETARY_FTPUSER} \
        --env PROPRIETARY_FTPPASSWORD=${PROPRIETARY_FTPPASSWORD} \
        --env PROPRIETARY_PLUGINSPATH=${PROPRIETARY_PLUGINSPATH} \
        --env PROPRIETARY_THEMESPATH=${PROPRIETARY_THEMESPATH} \
        --env WORDPRESS_DEBUG=1 \
        --env WORDPRESS_DB_NAME=${PROJECT_NAME} \
        --env WORDPRESS_DB_HOST=aivec_wp_mysql \
        --env WORDPRESS_DB_USER=admin \
        --env WORDPRESS_DB_PASSWORD=admin \
        --network=${NETWORK_NAME}_default \
        wordpress_devenv_visiblevc

    docker logs -f ${WP_CONTAINER_NAME}
}

stopContainer() {
    i=$1 # config index

    config=$(cat wp-instances.json | jq -r --arg index "$i" '.[$index | tonumber]')
    project_name=$(echo $config | jq -r '.["project-name"]')
    WP_CONTAINER_NAME=${project_name}_dev_wp
    docker stop $WP_CONTAINER_NAME
    docker rm $WP_CONTAINER_NAME
}

runNGROK() {
    i=$1 # config index

    config=$(cat wp-instances.json | jq -r --arg index "$i" '.[$index | tonumber]')
    WP_PORT=$(echo $config | jq -r '.["container-port"]')
    command -v ngrok >/dev/null 2>&1 || {
        echo -e "${FATAL} ${WHITE}${YELLOW}ngrok${WHITE} is either not installed or not in your PATH. ${YELLOW}ngrok${WHITE} is required to pipe HTTP through an SSL tunnel. Please install it. https://ngrok.com/download" >&2
        exit 1
    }
    ngrok http localhost:${WP_PORT}
}

logContainer() {
    i=$1 # config index

    config=$(cat wp-instances.json | jq -r --arg index "$i" '.[$index | tonumber]')
    project_name=$(echo $config | jq -r '.["project-name"]')
    WP_CONTAINER_NAME=${project_name}_dev_wp
    docker logs -f ${WP_CONTAINER_NAME}
}

redumpDB() {
    i=$1 # config index

    config=$(cat wp-instances.json | jq -r --arg index "$i" '.[$index | tonumber]')
    project_name=$(echo $config | jq -r '.["project-name"]')
    WP_CONTAINER_NAME=${project_name}_dev_wp
    docker exec -it ${WP_CONTAINER_NAME} /bin/sh -c "php redump.php root root ${project_name} /data/db.sql"
}

createNewDumpfile() {
    i=$1 # config index

    config=$(cat wp-instances.json | jq -r --arg index "$i" '.[$index | tonumber]')
    project_name=$(echo $config | jq -r '.["project-name"]')
    WP_CONTAINER_NAME=${project_name}_dev_wp
    printf "\n${INFO} ${WHITE}New dump-files are placed in a folder named ${YELLOW}dumpfiles${WHITE} in this directory${NC}\n"
    printf "Please enter a file name for your new dump-file (.sql is not required): "
    read filename
    docker exec -it ${WP_CONTAINER_NAME} /bin/sh -c "php redump.php root root ${project_name} /app/dumpfiles/$filename.sql"
}

toggleSSL() {
    i=$1 # config index

    config=$(cat wp-instances.json | jq -r --arg index "$i" '.[$index | tonumber]')
    project_name=$(echo $config | jq -r '.["project-name"]')
    WP_CONTAINER_NAME=${project_name}_dev_wp

    if docker exec -it ${WP_CONTAINER_NAME} /bin/bash -c 'grep "define(\"WP_SITEURL\"" wp-config.php'; then
        docker exec -it ${WP_CONTAINER_NAME} /bin/sh -c "sed -i '/^define(\"WP_HOME\"/d' wp-config.php"
        docker exec -it ${WP_CONTAINER_NAME} /bin/sh -c "sed -i '/^define(\"WP_SITEURL\"/d' wp-config.php"
        docker exec -it ${WP_CONTAINER_NAME} /bin/sh -c "wp plugin deactivate relative-url"
        echo -e "\n${INFO} ${WHITE}Toggled SSL ${YELLOW}OFF${NC}"
    else
        docker exec -it ${WP_CONTAINER_NAME} /bin/sh -c "sed -i '/all, stop editing!/ a define(\"WP_SITEURL\", \"http://\" . \$_SERVER[\"HTTP_HOST\"]);' /app/wp-config.php"
        docker exec -it ${WP_CONTAINER_NAME} /bin/sh -c "sed -i '/all, stop editing!/ a define(\"WP_HOME\", \"http://\" . \$_SERVER[\"HTTP_HOST\"]);' /app/wp-config.php"
        docker exec -it ${WP_CONTAINER_NAME} /bin/sh -c "wp plugin activate relative-url"
        echo -e "\n${INFO} ${WHITE}Toggled SSL ${GREEN}ON${NC}"
    fi
}

toggleDeploymentBundleAsPluginVolume() {
    i=$1 # config index

    config=$(cat wp-instances.json | jq -r --arg index "$i" '.[$index | tonumber]')

    plugincount=$(echo $config | jq -r '.["local-plugins"] | length')
    plugincount=$(($plugincount - 1))
    plugins=()

    pi=0
    while [ $pi -le $plugincount ]; do
        pname=$(echo $config | jq -r --arg index "$pi" '.["local-plugins"][$index | tonumber]')
        plugins+=($pname)
        pi=$(($pi + 1))
    done

    printf "\n"
    PS3='Select a plugin to build: '
    select selectedplugin in "${plugins[@]}"; do
        printf "\n"
        break
    done

    cd $selectedplugin
    plugin_name="${PWD##*/}"
    cd ../
    if [ -e "$plugin_name.devrepo.tar" ]; then
        printf "\n${INFO} ${WHITE}Found repo backup archive, setting volume back to ${YELLOW}development${WHITE} repo${NC}\n"
        rm -rf $plugin_name/*
        mv $plugin_name.devrepo.tar $plugin_name/git_bundle.tar
        cd $plugin_name
        tar -xf git_bundle.tar
        rm git_bundle.tar
    else
        printf "\n${INFO} ${WHITE}Replacing volume with ${GREEN}deployment${WHITE} bundle${NC}\n"
        cd $plugin_name
        if [ ! -e "zip_plugin.sh" ]; then
            printf "\n${FATAL} ${WHITE}${YELLOW}zip_plugin.sh${WHITE} does not exist in project folder. Aborting.\n"
            exit 1
        fi
        ./zip_plugin.sh
        mv $plugin_name*.zip ../$plugin_name.zip
        tar --create --file=../$plugin_name.devrepo.tar .
        cd ../
        rm -rf $plugin_name/*
        rm -rf $plugin_name/.* 2> /dev/null
        mv $plugin_name.zip $plugin_name/bundle.zip
        cd $plugin_name
        unzip bundle.zip
        cp -a $plugin_name*/. .
        rm bundle.zip
        find . ! -type f -name "$plugin_name*" | xargs rm -R
    fi
}

projectcount=$(cat wp-instances.json | jq -r '. | length')
projectcount=$(($projectcount - 1))
projects=()
declare -A indexmap

i=0
while [ $i -le $projectcount ]; do
    pname=$(cat wp-instances.json | jq -r --arg index "$i" '.[$index | tonumber]["project-name"]')
    indexmap[$pname]=$i
    projects+=($pname)
    i=$(($i + 1))
done

PS3='Select a project: '
select selectedproject in "${projects[@]}"; do
    echo -e "\n"
    break
done

while true; do
    read -p "1) Run Containers
2) Stop Containers
3) Launch NGROK (local SSL)
4) Toggle SSL
5) Log Container
6) Overwrite host dumpfile with DB of currently mounted volume
7) Create new host dumpfile with DB of currently mounted volume
8) Replace plugin volume with deployment ready bundle (Toggle)
q) quit
Select an operation to perform for '$selectedproject': " answer
    case $answer in
    [1]*)
        docker build -t wordpress_devenv_visiblevc:latest .
        echo -e "\n${INFO} ${WHITE}Running Container(s)...${NC}"
        docker-compose -p ${NETWORK_NAME} -f docker-compose.db.yml up -d
        runContainer "${indexmap[$selectedproject]}"
        exit
        ;;
    [2]*)
        echo -e "\n${INFO} ${WHITE}Stopping Container(s)...${NC}"
        stopContainer "${indexmap[$selectedproject]}"
        docker-compose -p ${NETWORK_NAME} -f docker-compose.db.yml down
        exit
        ;;
    [3]*)
        runNGROK "${indexmap[$selectedproject]}"
        exit
        ;;
    [4]*)
        toggleSSL "${indexmap[$selectedproject]}"
        exit
        ;;
    [5]*)
        logContainer "${indexmap[$selectedproject]}"
        exit
        ;;
    [6]*)
        redumpDB "${indexmap[$selectedproject]}"
        # echo -e "Wiping Mysql database and re-dumping with dump file...\n"
        exit
        ;;
    [7]*)
        createNewDumpfile "${indexmap[$selectedproject]}"
        # echo -e "Wiping Mysql database and re-dumping with dump file...\n"
        exit
        ;;
    [8]*)
        toggleDeploymentBundleAsPluginVolume "${indexmap[$selectedproject]}"
        # echo -e "Wiping Mysql database and re-dumping with dump file...\n"
        exit
        ;;
    [Qq]*)
        echo -e "\nBye."
        exit
        ;;
    *) echo "Please select a number" ;;
    esac
done
