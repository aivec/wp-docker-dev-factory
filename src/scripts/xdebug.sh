#!/bin/bash

# setting the XDEBUG_CONFIG environment variable doesn't seem to work so we hardcode it here
sudo sed -i '/^xdebug.client_host/d' /usr/local/etc/php/conf.d/xdebug.ini
sudo sh -c "echo 'xdebug.client_host=${DOCKER_BRIDGE_IP}' >> /usr/local/etc/php/conf.d/xdebug.ini"
