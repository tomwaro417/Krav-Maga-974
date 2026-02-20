#!/bin/bash
# deploy-lxc.sh
# Déploiement optimisé pour conteneur LXC Proxmox
# Approche: Installation directe (sans Docker) pour plus de légèreté

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }

APP_NAME="krav-maga-974"
APP_DIR="/opt/${APP_NAME}"
GITHUB_REPO="https://github.com/tomwaro417/Krav-Maga-974.git"

log "=== Déploiement Krav Maga 974 sur LXC ==="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en root"
    exit 1
fi

# Détection LXC
if [ -f /proc/1/environ ] && grep -q container=lxc /proc/1/environ 2>/dev/null; then
    success "Conteneur LXC détecté"
else
    warn "Ce script est optimisé pour LXC. Continuer quand même? (y/N)"
    read -r confirm
    [[ $confirm != [yY] ]] && exit 0
fi

# Questions de configuration
read -p "Nom de domaine (laisser vide pour IP): " DOMAIN
read -p "Port de l'app (défaut: 3000): " APP_PORT
APP_PORT=${APP_PORT:-3000}
read -p "Port PostgreSQL (défaut: 5432): " PG_PORT
PG_PORT=${PG_PORT:-5432}

# Vérifier la mémoire disponible
MEM_AVAILABLE=$(free -m | awk '/^Mem:/{print $7}')
if [ "$MEM_AVAILABLE" -lt 512 ]; then
    warn "Mémoire disponible faible (${MEM_AVAILABLE}MB). 1GB recommandé minimum."
fi

log "Mise à jour du système..."
apt-get update
apt-get upgrade -y
success "Système mis à jour"

# Installation des dépendances essentielles
log "Installation des dépendances..."
apt-get install -y \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    postgresql-15 \
    postgresql-client-15 \
    redis-server \
    build-essential \
    python3 \
    python3-pip

success "Dépendances installées"

# Installation Node.js 22
log "Installation de Node.js 22..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "22" ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi
success "Node.js $(node -v) installé"

# Installation pnpm
log "Installation de pnpm..."
npm install -g pnpm pm2
success "pnpm et PM2 installés"

# Configuration PostgreSQL
log "Configuration PostgreSQL..."
systemctl enable postgresql
systemctl start postgresql

# Créer l'utilisateur et la base de données
sudo -u postgres psql << EOF
CREATE USER fekm_user WITH PASSWORD 'fekm_secure_pass';
CREATE DATABASE fekm OWNER fekm_user;
GRANT ALL PRIVILEGES ON DATABASE fekm TO fekm_user;
\q
EOF

success "PostgreSQL configuré"

# Configuration Redis
log "Configuration Redis..."
systemctl enable redis-server
systemctl start redis-server
success "Redis configuré"

# Clonage du repository
log "Clonage du repository..."
if [ -d "$APP_DIR" ]; then
    warn "Le répertoire existe déjà"
    cd "$APP_DIR"
    git pull origin master
else
    git clone "$GITHUB_REPO" "$APP_DIR"
    cd "$APP_DIR"
fi
success "Repository cloné"

# Configuration de l'environnement
log "Configuration de l'environnement..."

# Génération des secrets
AUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

cat > apps/web/.env << EOF
# Database (local PostgreSQL)
DATABASE_URL="postgresql://fekm_user:fekm_secure_pass@localhost:${PG_PORT}/fekm?schema=public"

# Auth
AUTH_SECRET="${AUTH_SECRET}"
JWT_SECRET="${JWT_SECRET}"

# App
NEXT_PUBLIC_APP_URL="${DOMAIN:+https://}${DOMAIN:-http://$(hostname -I | awk '{print $1}')}:${APP_PORT}"
NODE_ENV=production
PORT=${APP_PORT}
HOSTNAME=0.0.0.0

# Redis
REDIS_URL=redis://localhost:6379

# Optional: S3/MinIO (pour plus tard)
# S3_ENDPOINT=
# S3_BUCKET=
# S3_ACCESS_KEY=
# S3_SECRET_KEY=
# S3_REGION=
EOF

success "Fichier .env créé"

# Build de l'application
log "Installation des dépendances et build..."
cd apps/web
pnpm install

# Génération Prisma
pnpm prisma generate
pnpm prisma migrate deploy

# Seed de la base de données
log "Initialisation de la base de données..."
node prisma/seed.js

# Build de l'application
log "Build de l'application (peut prendre quelques minutes)..."
pnpm build

success "Build terminé"

# Configuration PM2
log "Configuration PM2..."
cd "$APP_DIR/apps/web"

cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: './node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: ${APP_PORT}
    },
    error_file: '/var/log/${APP_NAME}/err.log',
    out_file: '/var/log/${APP_NAME}/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '512M',
    restart_delay: 3000,
    max_restarts: 5,
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', '.next', 'logs'],
    kill_timeout: 5000,
    listen_timeout: 10000,
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Création des répertoires de logs
mkdir -p /var/log/${APP_NAME}
chmod 755 /var/log/${APP_NAME}

success "Configuration PM2 créée"

# Configuration Nginx
log "Configuration Nginx..."

if [ -n "$DOMAIN" ]; then
    # Configuration avec domaine (SSL)
    cat > /etc/nginx/sites-available/${APP_NAME} << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL (sera configuré par Certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # Sécurité SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    client_max_body_size 100M;

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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache des assets statiques
    location /_next/static {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
else
    # Configuration sans domaine (IP locale)
    cat > /etc/nginx/sites-available/${APP_NAME} << EOF
server {
    listen 80;
    server_name _;

    client_max_body_size 100M;

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
}
EOF
fi

# Activation du site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/

# Test et reload
nginx -t && systemctl reload nginx
success "Nginx configuré"

# SSL si domaine fourni
if [ -n "$DOMAIN" ]; then
    log "Obtention du certificat SSL..."
    certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m admin@${DOMAIN}
    success "SSL configuré"
fi

# Firewall
log "Configuration du firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
success "Firewall configuré"

# Fail2Ban
log "Configuration Fail2Ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl restart fail2ban
success "Fail2Ban configuré"

# Création du service systemd pour PM2
log "Création du service systemd..."
ENV_PATH="$(dirname $(which node)):$(which node | sed 's|/node$||')"

cat > /etc/systemd/system/${APP_NAME}.service << EOF
[Unit]
Description=Krav Maga 974 - Next.js Application
Documentation=https://github.com/tomwaro417/Krav-Maga-974
After=network.target postgresql.service redis-server.service
Wants=postgresql.service redis-server.service

[Service]
Type=forking
User=root
WorkingDirectory=${APP_DIR}/apps/web
Environment=PATH=${ENV_PATH}:/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
PIDFile=/root/.pm2/pm2.pid

ExecStartPre=/usr/bin/mkdir -p /var/log/${APP_NAME}
ExecStart=/usr/local/bin/pm2 start ecosystem.config.js
ExecReload=/usr/local/bin/pm2 reload ${APP_NAME}
ExecStop=/usr/local/bin/pm2 stop ${APP_NAME}

Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${APP_NAME}.service
success "Service systemd créé"

# Script de gestion
log "Création du script de gestion..."
cat > /usr/local/bin/${APP_NAME} << EOF
#!/bin/bash
# Gestion de l'application Krav Maga 974

APP_DIR="${APP_DIR}/apps/web"

case "\$1" in
    start)
        echo "Démarrage..."
        systemctl start ${APP_NAME}
        ;;
    stop)
        echo "Arrêt..."
        systemctl stop ${APP_NAME}
        ;;
    restart)
        echo "Redémarrage..."
        systemctl restart ${APP_NAME}
        ;;
    status)
        systemctl status ${APP_NAME}
        ;;
    logs)
        tail -f /var/log/${APP_NAME}/out.log /var/log/${APP_NAME}/err.log
        ;;
    pm2-logs)
        pm2 logs ${APP_NAME}
        ;;
    pm2-monit)
        pm2 monit
        ;;
    update)
        echo "Mise à jour..."
        cd ${APP_DIR}
        git pull origin master
        pnpm install
        pnpm prisma migrate deploy
        pnpm build
        systemctl restart ${APP_NAME}
        ;;
    backup)
        echo "Backup de la base de données..."
        mkdir -p ${APP_DIR}/../../backups
        pg_dump -U fekm_user -h localhost fekm | gzip > ${APP_DIR}/../../backups/backup-\$(date +%Y%m%d-%H%M%S).sql.gz
        echo "Backup créé dans ${APP_DIR}/../../backups/"
        ;;
    shell)
        cd ${APP_DIR}
        bash
        ;;
    db-shell)
        sudo -u postgres psql -d fekm
        ;;
    *)
        echo "Usage: $APP_NAME {start|stop|restart|status|logs|pm2-logs|pm2-monit|update|backup|shell|db-shell}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/${APP_NAME}
success "Script de gestion créé"

# Démarrage de l'application
log "Démarrage de l'application..."
systemctl start ${APP_NAME}
sleep 5

# Vérification
if systemctl is-active --quiet ${APP_NAME}; then
    success "Application démarrée avec succès"
else
    error "L'application n'a pas démarré correctement"
    journalctl -u ${APP_NAME} --no-pager -n 50
    exit 1
fi

# Affichage final
echo ""
echo "=========================================="
echo "  🥋 DÉPLOIEMENT LXC TERMINÉ 🥋"
echo "=========================================="
echo ""
echo "📍 Accès:"
if [ -n "$DOMAIN" ]; then
    echo "   https://${DOMAIN}"
else
    echo "   http://$(hostname -I | awk '{print $1}')"
fi
echo ""
echo "👤 Comptes démo:"
echo "   Admin: admin@example.com / admin123!"
echo "   User:  demo@example.com / demo123!"
echo ""
echo "🎛️  Commandes:"
echo "   krav-maga-974 {start|stop|restart|status|logs|update|backup}"
echo ""
echo "📊 Monitoring:"
echo "   pm2 status     - Statut PM2"
echo "   pm2 monit      - Monitoring temps réel"
echo ""
echo "⚠️  IMPORTANT: Changez les mots de passe !"
echo "=========================================="
