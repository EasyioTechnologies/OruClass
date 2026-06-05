ssh oru "cd /docker/OruClass && docker compose -f docker-compose.prod.yml down -v && git pull origin main && docker compose -f docker-compose.prod.yml up -d --build"
