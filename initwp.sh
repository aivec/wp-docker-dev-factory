#!/bin/bash

declare -i term_width=70

h2() {
    printf '\e[1;33m==>\e[37;1m %s\e[0m\n' "$*"
}

logger() {
    fold --width $((term_width - 9)) -s | sed -n '
    /^\x1b\[[0-9;]*m/{ # match any line beginning with colorized text
        s/Error:/  \0/ # pads line so its length matches others
        p              # any lines containing color
        b              # branch to end
    }
    s/.*/         \0/p # pads all other lines with 9 spaces
    '
}

# setting the XDEBUG_CONFIG environment variable doesn't seem to work so we hardcode it here
sudo sh -c "echo 'xdebug.remote_host=${DOCKER_BRIDGE_IP}' >> /usr/local/etc/php/conf.d/xdebug.ini"

# PHP doesnt seem to pick up on environment variables when started via apache so we
# have to explicitly list them for apache
if [[ ! -z ${APACHE_ENV_VARS} ]]; then
    echo $APACHE_ENV_VARS | jq -r 'keys[]' | while read key; do
        val=$(echo $APACHE_ENV_VARS | jq -r ".[\"$key\"]")
        echo "export ${key}=${val}" | sudo tee -a /etc/apache2/envvars >/dev/null
    done
fi

h2 "Updating blogname..."
wp option update blogname "${INSTANCE_NAME}" |& logger

h2 "Setting site language to ${WP_LOCALE}"
wp language core install ${WP_LOCALE} |& logger
wp site switch-language ${WP_LOCALE} |& logger

if [[ ! -z ${FTP_CONFIGS} ]]; then
    mkdir -p /app/temp/plugins
    mkdir -p /app/temp/themes
    h2 "Pulling non-free plugins/themes from FTP server via lftp. This may take some time..."
    configcount=$(echo $FTP_CONFIGS | jq -r '. | length')
    configcount=$(($configcount - 1))
    configi=0
    while [ $configi -le $configcount ]; do
        config=$(echo $FTP_CONFIGS | jq -r --arg index "$configi" '.[$index | tonumber]')
        host=$(echo $config | jq -r '.["host"]')
        user=$(echo $config | jq -r '.["user"]')
        password=$(echo $config | jq -r '.["password"]')
        plugins=$(echo $config | jq -r '.["plugins"]')
        themes=$(echo $config | jq -r '.["themes"]')

        if [ "$plugins" != "null" ] && [ ! -z "$plugins" ]; then
            plugincount=$(echo $plugins | jq -r '. | length')
            plugincount=$(($plugincount - 1))
            plugini=0
            mkdir -p plugins && cd plugins
            while [ $plugini -le $plugincount ]; do
                path=$(echo $plugins | jq -r --arg index "$plugini" '.[$index | tonumber]')
                file="$path.zip"
                lftp -c "open -u $user,$password $host; mget ${file};"
                plugini=$(($plugini + 1))
            done
            cd ../
            cp -a plugins/. /app/temp/plugins/
        fi

        if [ "$themes" != "null" ] && [ ! -z "$themes" ]; then
            themecount=$(echo $themes | jq -r '. | length')
            themecount=$(($themecount - 1))
            themei=0
            mkdir -p themes && cd themes
            while [ $themei -le $themecount ]; do
                path=$(echo $themes | jq -r --arg index "$themei" '.[$index | tonumber]')
                file="$path.zip"
                lftp -c "open -u $user,$password $host; mget ${file};"
                themei=$(($themei + 1))
            done
            cd ../
            cp -a themes/. /app/temp/themes/
        fi

        configi=$(($configi + 1))
    done

    cd /app/temp/plugins
    plugins=($(find . -maxdepth 1 -name '*.zip'))
    echo "Installing downloaded plugins..." |& logger
    for zipfile in "${plugins[@]}"; do
        echo "$zipfile" |& logger
        wp plugin install /app/temp/plugins/$zipfile |& logger
        rm "$zipfile"
    done

    cd /app/temp/themes
    themes=($(find . -maxdepth 1 -name '*.zip'))
    echo "Installing downloaded themes..." |& logger
    for zipfile in "${themes[@]}"; do
        echo "$zipfile" |& logger
        wp theme install /app/temp/themes/$zipfile |& logger
        rm "$zipfile"
    done
fi

cd

if [[ ! -z ${SSH_CONFIGS} ]]; then
    mkdir -p /app/temp/ssh/plugins
    mkdir -p /app/temp/ssh/themes
    h2 "Pulling non-free plugins/themes from SSH server via scp. This may take some time..."
    configcount=$(echo $SSH_CONFIGS | jq -r '. | length')
    configcount=$(($configcount - 1))
    configi=0
    while [ $configi -le $configcount ]; do
        config=$(echo $SSH_CONFIGS | jq -r --arg index "$configi" '.[$index | tonumber]')
        host=$(echo $config | jq -r '.["host"]')
        user=$(echo $config | jq -r '.["user"]')
        plugins=$(echo $config | jq -r '.["plugins"]')
        themes=$(echo $config | jq -r '.["themes"]')
        privateKeyFilename=$(echo $config | jq -r '.["privateKeyFilename"]')
        privateKeyPath="/app/ssh/$privateKeyFilename"
        chmod 600 $privateKeyPath
        #port=$(echo $config | jq -r '.["port"]')
        #if [ "$plugins" != "null" ]; then
        #    port="-P $port"
        #else
        #    port="-P 22"
        #fi

        if [ "$plugins" != "null" ] && [ ! -z "$plugins" ]; then
            plugincount=$(echo $plugins | jq -r '. | length')
            plugincount=$(($plugincount - 1))
            plugini=0
            while [ $plugini -le $plugincount ]; do
                path=$(echo $plugins | jq -r --arg index "$plugini" '.[$index | tonumber]')
                file="$path.zip"
                scp -o StrictHostKeyChecking=no -i $privateKeyPath $user@$host:${file} /app/temp/ssh/plugins
                plugini=$(($plugini + 1))
            done
        fi

        if [ "$themes" != "null" ] && [ ! -z "$themes" ]; then
            themecount=$(echo $themes | jq -r '. | length')
            themecount=$(($themecount - 1))
            themei=0
            while [ $themei -le $themecount ]; do
                path=$(echo $themes | jq -r --arg index "$themei" '.[$index | tonumber]')
                file="$path.zip"
                scp -o StrictHostKeyChecking=no -i $privateKeyPath $user@$host:${file} /app/temp/ssh/themes
                themei=$(($themei + 1))
            done
        fi

        configi=$(($configi + 1))
    done

    cd /app/temp/ssh/plugins
    plugins=($(find . -maxdepth 1 -name '*.zip'))
    echo "Installing downloaded plugins..." |& logger
    for zipfile in "${plugins[@]}"; do
        echo "$zipfile" |& logger
        wp plugin install /app/temp/ssh/plugins/$zipfile |& logger
        rm "$zipfile"
    done

    cd /app/temp/ssh/themes
    themes=($(find . -maxdepth 1 -name '*.zip'))
    echo "Installing downloaded themes..." |& logger
    for zipfile in "${themes[@]}"; do
        echo "$zipfile" |& logger
        wp theme install /app/temp/ssh/themes/$zipfile |& logger
        rm "$zipfile"
    done
fi

cd

if [[ -e "/data/db.sql" ]]; then
    h2 "Attempting to install active plugins from dump file. This may take some time..."
    mysql --user=$DB_USER --password=$DB_PASS --host=$DB_HOST -uroot -e "CREATE DATABASE temp" |& logger
    mysql --user=$DB_USER --password=$DB_PASS --host=$DB_HOST temp </data/db.sql |& logger

    active_plugins=$(php /app/get_active_plugins.php ${DB_USER} ${DB_PASS} temp ${DB_PREFIX})
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

wp plugin deactivate relative-url |& logger

#h2 "Generating a self-signed cert and configuring Apache for localhost SSL..."
#
#sudo su -c 'openssl genrsa -out /etc/ssl/private/apache-selfsigned.key 3072'
#sudo su -c 'openssl req -new -out website.csr -sha256 -key /etc/ssl/private/apache-selfsigned.key \
#    -subj "/C=AT/ST=Vienna/L=Vienna/O=Security/OU=Development/CN=localhost"'
#sudo su -c 'openssl x509 -req -in website.csr -days 365 \
#    -signkey /etc/ssl/private/apache-selfsigned.key \
#    -out /etc/ssl/certs/apache-selfsigned.crt -outform PEM'

#sudo su -c 'chmod 600 /etc/ssl/certs/apache-selfsigned.crt'
#sudo su -c 'chmod 600 /etc/ssl/private/apache-selfsigned.key'

#sudo tee -a /etc/apache2/conf-available/ssl-params.conf >/dev/null <<EOT
#SSLCipherSuite EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH
#SSLProtocol All -SSLv2 -SSLv3 -TLSv1 -TLSv1.1
#SSLHonorCipherOrder On
## Disable preloading HSTS for now.  You can use the commented out header line that includes
## the "preload" directive if you understand the implications.
## Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
#Header always set X-Frame-Options DENY
#Header always set X-Content-Type-Options nosniff
## Requires Apache >= 2.4
#SSLCompression off
#SSLUseStapling off
#SSLStaplingCache "shmcb:logs/stapling-cache(150000)"
## Requires Apache >= 2.4.11
#SSLSessionTickets Off
#EOT

#sudo su -c 'sed -i "/^\s*SSLCertificateFile/c\SSLCertificateFile \/etc\/ssl\/certs\/apache-selfsigned.crt" /etc/apache2/sites-available/default-ssl.conf'
#sudo su -c 'sed -i "/^\s*SSLCertificateKeyFile/c\SSLCertificateKeyFile \/etc\/ssl\/private\/apache-selfsigned.key" /etc/apache2/sites-available/default-ssl.conf'
#sudo su -c 'sed -i "/^\s*ServerAdmin/ a ServerName localhost" /etc/apache2/sites-available/default-ssl.conf'
#sudo su -c 'sed -i "s/_default_/*/g" /etc/apache2/sites-available/default-ssl.conf'
#sudo su -c 'a2enmod rewrite'
#sudo su -c 'a2enmod headers'
#sudo su -c 'a2ensite default-ssl'
#sudo su -c 'a2enmod ssl'
#sudo su -c 'a2enconf ssl-params'
#wp plugin deactivate relative-url
