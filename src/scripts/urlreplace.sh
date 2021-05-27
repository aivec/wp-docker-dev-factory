#!/bin/bash

source ${AVC_SCRIPTS_DIR}/logging.sh

siteurl=$(wp option get siteurl)
if [ "$siteurl" != "${URL_REPLACE}" ]; then
    h2 'Replacing URLs in database (this might take a while)...'
    wp search-replace $siteurl ${URL_REPLACE};
fi
