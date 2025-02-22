#!/bin/sh

if [ -z "$MYSQL_DATABASE" ]; then
    echo "Environment variable MYSQL_DATABASE not set. Aborting."
    exit 1
fi

mysql <<EOF
DROP DATABASE IF EXISTS \`$MYSQL_DATABASE\`;
CREATE DATABASE \`$MYSQL_DATABASE\`;
EOF

echo "Database $MYSQL_DATABASE has been created."
