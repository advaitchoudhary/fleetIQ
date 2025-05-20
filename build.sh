#!/bin/bash

cd /var/www/fleet-management

git reset --hard

git pull

cd /var/www/fleet-management/client

npm install

npm run build

sudo rm -rf /var/www/html/*

sudo cp -r dist/* /var/www/html/

sudo nginx -t

sudo systemctl reload nginx


cd /var/www/fleet-management/server

npm install --save-dev typescript

npm run build

pm2 restart fleet-api

cd /var/www/fleet-management
