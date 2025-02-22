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

# If a previously mounted plugin/theme volume is changed to a download plugin/theme, Docker will
# create an empty directory as root:root where the volume used to be. This causes download installs
# in those directories to fail, so we preemptively change user:group for all plugins and themes
sudo chown -R admin:admin /var/www/html/wp-content/plugins
sudo chown -R admin:admin /var/www/html/wp-content/themes

${AVC_SCRIPTS_DIR}/initwp.sh

sudo rm -f /var/run/apache2/apache2.pid
sudo apache2-foreground
