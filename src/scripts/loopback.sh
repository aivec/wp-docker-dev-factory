#!/bin/bash

# By default, Apache only exposes ports 80 and 443 (SSL). Port 80 is forwarded from inside the container to the host
# on whatever host port is specified with 'docker run -p xx:xx' (eg. 9200:80). This allows the host to access the WordPress
# container at localhost:9200, which is sufficient in most cases. However, things like wp-cron, if not using ALTERNATE_WP_CRON,
# will fail. The failure occurs because the default implementation of things like wp-cron use wp_remote_post to send a request
# to the server FROM WITHIN THE CONTAINER. Sending any request FROM WITHIN THE CONTAINER to site_url or home_url fails because
# these URLs contain the port number used BY THE HOST (eg. localhost:9200). From within the container, the WordPress
# install can only be accessed via localhost:80. The following two lines tell Apache to ALSO LISTEN ON THE HOST PORT for requests
# sent from within the container.

sudo sed -i '/^#container-port/,+1d' /etc/apache2/ports.conf
sudo sh -c "echo \"#container-port:\" >> /etc/apache2/ports.conf"
sudo sh -c "echo \"Listen ${DOCKER_CONTAINER_PORT}\" >> /etc/apache2/ports.conf"
sudo sed -i "/VirtualHost \*:80/c\<VirtualHost \*:80 \*:${DOCKER_CONTAINER_PORT}>" /etc/apache2/sites-enabled/000-default.conf
