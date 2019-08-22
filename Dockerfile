FROM visiblevc/wordpress:latest

RUN sudo apt-get update && sudo apt-get install -y --no-install-recommends lftp

SHELL ["/bin/sh", "-c"]

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
