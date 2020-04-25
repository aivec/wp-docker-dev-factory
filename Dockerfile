FROM visiblevc/wordpress:latest-php7.3

RUN curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
RUN sudo apt-get update && sudo apt-get install -y --no-install-recommends lftp \
        libfreetype6-dev \
        libmcrypt-dev \
        libjpeg-dev \
        libpng-dev \
        ssh \
        jq \
        nodejs
RUN sudo -E docker-php-ext-configure gd --with-freetype-dir=/usr/freetype2 --with-png-dir=/usr --with-jpeg-dir=/usr
RUN sudo -E docker-php-ext-install pdo_mysql gd

SHELL ["/bin/sh", "-c"]

# Strict error/notice reporting
RUN sudo sh -c 'echo "error_reporting=E_ALL" >> /usr/local/etc/php/php.ini'

# Install xdebug for PHP live debugging in vscode
RUN yes | sudo pecl install xdebug \
    && sudo sh -c 'echo "zend_extension=$(find /usr/local/lib/php/extensions/ -name xdebug.so)" > /usr/local/etc/php/conf.d/xdebug.ini' \
    && sudo sh -c 'echo "xdebug.remote_enable=1" >> /usr/local/etc/php/conf.d/xdebug.ini' \
    && sudo sh -c 'echo "xdebug.remote_port=9900" >> /usr/local/etc/php/conf.d/xdebug.ini' \
    && sudo sh -c 'echo "xdebug.remote_autostart=1" >> /usr/local/etc/php/conf.d/xdebug.ini' \
    && sudo sh -c 'echo "xdebug.profiler_enable=1" >> /usr/local/etc/php/conf.d/xdebug.ini' \
    && sudo sh -c 'echo "xdebug.profiler_output_name=cachegrind.out.%t" >> /usr/local/etc/php/conf.d/xdebug.ini' \
    && sudo sh -c 'echo "xdebug.profiler_output_dir=/tmp" >> /usr/local/etc/php/conf.d/xdebug.ini'

CMD ["/run.sh"]
