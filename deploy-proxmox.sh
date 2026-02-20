#!/bin/bash
# deploy-kravmaga-proxmox.sh
# Script de déploiement pour Proxmox (LXC Container ou VM)
# Application: Krav Maga 974 - FEKM MVP

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }

# Configuration par défaut
APP_NAME="krav-maga-974"
APP_DIR="/opt/${APP_NAME}"
GITHUB_REPO="https://github.com/tomwaro417/Krav-Maga-974.git"
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-admin@localhost}"

log "=== Déploiement Krav Maga 974 sur Proxmox ==="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en root (sudo)"
    exit 1
fi

# Demander les informations nécessaires
read -p "Nom de domaine (laisser vide pour IP locale): " DOMAIN
read -p "Email pour les notifications: " EMAIL
read -p "Port d'accès (défaut: 3000): " APP_PORT
APP_PORT=${APP_PORT:-3000}

log "Mise à jour du système..."
apt-get update && apt-get upgrade -y
success "Système à jour"

# Installation des dépendances
log "Installation des dépendances..."
apt-get install -y \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban

success "Dépendances installées"

# Installation de Docker
log "Installation de Docker..."
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Docker Compose standalone (v2)
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    success "Docker installé"
else
    success "Docker déjà présent"
fi

# Installation de Node.js 22
log "Installation de Node.js 22..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "22" ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    success "Node.js $(node -v) installé"
else
    success "Node.js $(node -v) déjà présent"
fi

# Installation de pnpm
log "Installation de pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
    success "pnpm installé"
else
    success "pnpm déjà présent"
fi

# Clonage du repo
log "Clonage du repository..."
if [ -d "$APP_DIR" ]; then
    warn "Le répertoire $APP_DIR existe déjà"
    read -p "Supprimer et recloner? (y/N): " confirm
    if [[ $confirm == [yY] ]]; then
        rm -rf "$APP_DIR"
        git clone "$GITHUB_REPO" "$APP_DIR"
    else
        cd "$APP_DIR"
        git pull origin master
    fi
else
    git clone "$GITHUB_REPO" "$APP_DIR"
fi
success "Repository cloné dans $APP_DIR"

cd "$APP_DIR"

# Génération des secrets
log "Génération des secrets..."
AUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
success "Secrets générés"

# Création du fichier .env
log "Configuration de l'environnement..."
cat > apps/web/.env << EOF
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fekm?schema=public"

# Auth
AUTH_SECRET="${AUTH_SECRET}"
JWT_SECRET="${JWT_SECRET}"

# App
NEXT_PUBLIC_APP_URL="${DOMAIN:+https://}${DOMAIN:-http://$(hostname -I | awk '{print $1}')}:${APP_PORT}"
NODE_ENV=production

# Optional: S3/MinIO (décommenter pour activer)
# S3_ENDPOINT=http://localhost:9000
# S3_BUCKET=kravmaga-videos
# S3_ACCESS_KEY=minio
# S3_SECRET_KEY=minio123456
# S3_REGION=us-east-1
EOF

success "Fichier .env créé"

# Configuration Docker Compose pour production
log "Configuration Docker Compose..."
cat > docker-compose.prod.yml << 'EOF'
services:
  app:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/fekm?schema=public
      - AUTH_SECRET=${AUTH_SECRET}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    depends_on:
      - db
      - redis
    networks:
      - kravmaga-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fekm
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - kravmaga-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    networks:
      - kravmaga-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Optionnel: MinIO pour le stockage vidéo
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123456
    volumes:
      - miniodata:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - kravmaga-network
    restart: unless-stopped

  # Optionnel: Backup automatique de la DB
  backup:
    image: postgres:16-alpine
    volumes:
      - ./backups:/backups
      - /etc/localtime:/etc/localtime:ro
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fekm
      POSTGRES_HOST: db
    command: >
      sh -c '
        echo "0 2 * * * PGPASSWORD=\$POSTGRES_PASSWORD pg_dump -h \$POSTGRES_HOST -U \$POSTGRES_USER \$POSTGRES_DB | gzip > /backups/backup-\$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz" | crontab - && crond -f
      '
    depends_on:
      - db
    networks:
      - kravmaga-network
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  miniodata:

networks:
  kravmaga-network:
    driver: bridge
EOF

success "docker-compose.prod.yml créé"

# Création du Dockerfile pour production
log "Création du Dockerfile..."
mkdir -p apps/web
cat > apps/web/Dockerfile << 'EOF'
# Étape 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Installation de pnpm
RUN npm install -g pnpm

# Copie des fichiers de dépendances
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copie du code source
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build de l'application
RUN pnpm prisma generate
RUN pnpm build

# Étape 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Installation de pnpm et wget (pour healthcheck)
RUN npm install -g pnpm && apk add --no-cache wget

# Copie des fichiers nécessaires
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# Installation des dépendances de production
RUN pnpm install --prod --frozen-lockfile

# Exposition du port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Démarrage
CMD ["node", "server.js"]
EOF

success "Dockerfile créé"

# Configuration de next.config pour standalone
log "Configuration Next.js pour standalone..."
if [ -f "apps/web/next.config.mjs" ]; then
    # Backup
    cp apps/web/next.config.mjs apps/web/next.config.mjs.bak
    
    # Modification pour output: 'standalone'
    cat > apps/web/next.config.mjs << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Activer si besoin de server actions
    serverActions: true,
  },
}

export default nextConfig
EOF
    success "next.config.mjs configuré pour standalone"
fi

# Création des répertoires de backup
mkdir -p backups
chmod 755 backups

# Configuration Nginx (si domaine fourni)
if [ -n "$DOMAIN" ]; then
    log "Configuration Nginx pour ${DOMAIN}..."
    
    cat > /etc/nginx/sites-available/${APP_NAME} << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Sécurité: limiter la taille des uploads
    client_max_body_size 100M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;
}
EOF

    # Activation du site
    ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test de la config
    nginx -t && systemctl reload nginx
    success "Nginx configuré"
    
    # SSL avec Certbot
    log "Obtention du certificat SSL..."
    certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m ${EMAIL}
    success "Certificat SSL installé"
fi

# Configuration du firewall
log "Configuration du firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow ${APP_PORT}/tcp comment 'Krav Maga App'
ufw --force enable
success "Firewall configuré"

# Configuration Fail2Ban
log "Configuration Fail2Ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl restart fail2ban
success "Fail2Ban configuré"

# Script de gestion
log "Création du script de gestion..."
cat > /usr/local/bin/${APP_NAME} << 'EOF'
#!/bin/bash
# Script de gestion Krav Maga 974

APP_DIR="/opt/krav-maga-974"
COMPOSE_FILE="docker-compose.prod.yml"

cd "$APP_DIR"

case "$1" in
    start)
        echo "Démarrage de l'application..."
        docker-compose -f $COMPOSE_FILE up -d
        ;;
    stop)
        echo "Arrêt de l'application..."
        docker-compose -f $COMPOSE_FILE down
        ;;
    restart)
        echo "Redémarrage de l'application..."
        docker-compose -f $COMPOSE_FILE restart
        ;;
    logs)
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    status)
        docker-compose -f $COMPOSE_FILE ps
        ;;
    update)
        echo "Mise à jour de l'application..."
        docker-compose -f $COMPOSE_FILE pull
        docker-compose -f $COMPOSE_FILE up -d --build
        docker-compose -f $COMPOSE_FILE exec app pnpm prisma migrate deploy
        ;;
    backup)
        echo "Backup manuel de la base de données..."
        mkdir -p backups
        docker-compose -f $COMPOSE_FILE exec db pg_dump -U postgres fekm | gzip > backups/manual-backup-$(date +%Y%m%d-%H%M%S).sql.gz
        ;;
    shell)
        docker-compose -f $COMPOSE_FILE exec app sh
        ;;
    db-shell)
        docker-compose -f $COMPOSE_FILE exec db psql -U postgres -d fekm
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|update|backup|shell|db-shell}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/${APP_NAME}
success "Script de gestion créé: krav-maga-974 {start|stop|restart|logs|status|update|backup|shell|db-shell}"

# Démarrage des services
log "Démarrage des services Docker..."
docker-compose -f docker-compose.prod.yml up -d --build

log "Attente du démarrage de la base de données..."
sleep 10

# Initialisation de la base de données
log "Initialisation de la base de données..."
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -c "CREATE DATABASE fekm;" 2>/dev/null || true

# Migration et seed
docker-compose -f docker-compose.prod.yml exec app pnpm prisma migrate deploy || true
docker-compose -f docker-compose.prod.yml exec app pnpm prisma db seed || true

success "Base de données initialisée"

# Création du service systemd
log "Création du service systemd..."
cat > /etc/systemd/system/${APP_NAME}.service << EOF
[Unit]
Description=Krav Maga 974 Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${APP_DIR}
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${APP_NAME}.service
success "Service systemd créé et activé"

# Affichage des informations finales
echo ""
echo "=========================================="
echo "  🥋 DÉPLOIEMENT TERMINÉ 🥋"
echo "=========================================="
echo ""
echo "📍 Accès à l'application:"
if [ -n "$DOMAIN" ]; then
    echo "   - https://${DOMAIN}"
else
    echo "   - http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
fi
echo ""
echo "👤 Comptes de démo:"
echo "   - Admin: admin@example.com / admin123!"
echo "   - User:  demo@example.com / demo123!"
echo ""
echo "📁 Répertoire: ${APP_DIR}"
echo "🎛️  Gestion: krav-maga-974 {start|stop|restart|logs|status|update|backup|shell|db-shell}"
echo ""
echo "🐳 Services Docker:"
docker-compose -f ${APP_DIR}/docker-compose.prod.yml ps
echo ""
echo "⚠️  IMPORTANT: Changez les mots de passe par défaut !"
echo "=========================================="
