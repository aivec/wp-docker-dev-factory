#!/bin/bash

source ${AVC_SCRIPTS_DIR}/logging.sh

dbname=$(wp config get DB_NAME)
if [ "$dbname" != "$DB_NAME" ]; then
    wp config set DB_NAME $DB_NAME
fi

table_prefix=$(wp config get table_prefix)
if [ "$table_prefix" != "$DB_PREFIX" ]; then
    wp config set table_prefix $DB_PREFIX
fi

declare -i num_imported=0

if [[ -f "/data/db.sql" ]]; then
    if [ $FLUSH_DB_ON_RESTART -eq 1 ] && [ $RUNNING_FROM_CACHE -eq 1 ]; then
        h2 "Importing /data/db.sql (this might take a while)..."
        wp db drop --yes
        wp db create
        wp db import /data/db.sql
        ((num_imported++))
    fi
fi

siteurl=$(wp option get siteurl)
if [ "$siteurl" != "${URL_REPLACE}" ]; then
    h2 'Replacing URLs in database (this might take a while)...'
    wp search-replace \
        --skip-columns=guid \
        --report-changed-only \
        --no-report \
        "$(wp option get siteurl)" \
        "$URL_REPLACE" |& logger

    if ((num_imported > 0)); then
        h2 'Updating database...'
        wp core update-db |& logger
    fi
fi
