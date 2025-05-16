  #!/bin/bash
pkill -f "npm start"

echo "🔄 Resetting and building FRONTEND..."
cd /var/www/fleet-management/client || exit
rm -rf node_modules package-lock.json
npm install
npm run build
sudo cp -r dist/* /var/www/html/
sudo systemctl reload nginx

echo "✅ Frontend build complete."

echo "🔄 Resetting and building BACKEND..."
cd /var/www/fleet-management/server || exit
rm -rf node_modules package-lock.json
npm install
npm run build
npm start &
echo "✅ Backend build complete."