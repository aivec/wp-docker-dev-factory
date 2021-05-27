#!/bin/bash

source ${AVC_SCRIPTS_DIR}/logging.sh

if ! sudo mount -a 2> /dev/null; then
    printf '\e[1;31mERROR:\e[0m %s' \
        'Container running with improper privileges.
    Be sure your service is configured with the following options:
    ___
    services:
      wordpress:
        cap_add:
          - SYS_ADMIN
        devices:
          - /dev/fuse
        # needed on certain cloud hosts
        security_opt:
          - apparmor:unconfined
    ___
    OR (use first option if possible)
    ___
    services:
    wordpress:
        privileged: true
    ___
    ' | sed 's/^    //'
    exit 1
fi

h1 'Restarting From Cache (Using Snapshot)'

sudo chown -R admin:admin /app

${AVC_SCRIPTS_DIR}/initwp.sh

sudo rm -f /var/run/apache2/apache2.pid
sudo apache2-foreground
