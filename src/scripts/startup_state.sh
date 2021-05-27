#!/bin/bash

wp plugin is-active relative-url
if [ $? -eq 0 ]; then
    wp plugin deactivate relative-url |& logger
fi
