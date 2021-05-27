#!/bin/bash

source ${AVC_SCRIPTS_DIR}/logging.sh 

if [ -f "/data/db.sql" ]; then
    h2 "Attempting to install active plugins from dump file. This may take some time..."
    mysql --user=$DB_USER --password=$DB_PASS --host=$DB_HOST -uroot -e "CREATE DATABASE temp" |& logger
    mysql --user=$DB_USER --password=$DB_PASS --host=$DB_HOST temp </data/db.sql |& logger

    active_plugins=$(php ${AVC_SCRIPTS_DIR}/get_active_plugins.php ${DB_USER} ${DB_PASS} temp ${DB_PREFIX})
    for active_plugin in $(echo $active_plugins | jq -r '.[]'); do
        alreadyInstalled='0'
        for installed in $(echo $ALREADY_INSTALLED_PLUGINS | jq -r '.[]'); do
            if [[ "$active_plugin" == "$installed" ]]; then
                alreadyInstalled='1'
                break
            fi
        done
        if [[ "$alreadyInstalled" == "1" ]]; then
            wp plugin activate $active_plugin |& logger
        else
            wp plugin install --activate $active_plugin |& logger
        fi
    done

    mysql --user=$DB_USER --password=$DB_PASS --host=$DB_HOST -uroot -e "DROP DATABASE temp" |& logger
fi