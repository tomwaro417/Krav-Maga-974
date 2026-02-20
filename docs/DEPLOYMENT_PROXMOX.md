# 🥋 Déploiement Proxmox - Krav Maga 974

Ce guide explique comment déployer l'application sur un serveur Proxmox (VM ou LXC Container).

## 📋 Prérequis

- **Proxmox VE** avec une VM ou un LXC Container (Debian 12 recommandé)
- **Ressources minimales** : 2 vCPU, 4GB RAM, 20GB disque
- **Accès root** au serveur
- **Ports ouverts** : 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (app)

## 🚀 Déploiement Rapide

### 1. Créer la VM/Container sur Proxmox

**Option A: VM Debian 12**
```bash
# Template Debian 12 cloud-init
cd /var/lib/vz/template/iso
wget https://cloud.debian.org/images/cloud/bookworm/latest/debian-12-generic-amd64.qcow2
```

**Option B: LXC Container (plus léger)**
```bash
# Sur le node Proxmox
pct create 100 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
    --hostname kravmaga \
    --cores 2 \
    --memory 4096 \
    --swap 512 \
    --rootfs local-lvm:20 \
    --net0 name=eth0,bridge=vmbr0,ip=dhcp \
    --features nesting=1 \
    --onboot 1

pct start 100
pct exec 100 -- bash
```

### 2. Exécuter le script de déploiement

Dans la VM ou le container :

```bash
# Télécharger et exécuter le script
curl -fsSL https://raw.githubusercontent.com/tomwaro417/Krav-Maga-974/master/deploy-proxmox.sh -o deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh
```

Ou manuellement :

```bash
# Cloner le repo
git clone https://github.com/tomwaro417/Krav-Maga-974.git /opt/krav-maga-974
cd /opt/krav-maga-974

# Lancer le script
chmod +x deploy-proxmox.sh
sudo ./deploy-proxmox.sh
```

Le script va :
- Installer Docker, Node.js, Nginx
- Configurer le firewall (UFW) et Fail2Ban
- Créer les containers Docker (app, db, redis, minio)
- Initialiser la base de données avec les comptes de démo
- Configurer Nginx + SSL (si domaine fourni)

### 3. Accès

Après le déploiement :

- **Application** : http://<IP>:3000 ou https://<votre-domaine>
- **Comptes démo** :
  - Admin : `admin@example.com` / `admin123!`
  - User : `demo@example.com` / `demo123!`

## 🎛️ Commandes de Gestion

```bash
# Gestion de l'application
krav-maga-974 start      # Démarrer
krav-maga-974 stop       # Arrêter
krav-maga-974 restart    # Redémarrer
krav-maga-974 logs       # Voir les logs
krav-maga-974 status     # Statut des services
krav-maga-974 update     # Mettre à jour
krav-maga-974 backup     # Backup manuel DB
krav-maga-974 shell      # Shell dans l'app
krav-maga-974 db-shell   # Shell PostgreSQL
```

## 🔧 Configuration

### Variables d'environnement

Le fichier `.env` est créé automatiquement. Pour le modifier :

```bash
nano /opt/krav-maga-974/apps/web/.env

# Exemple de configuration
DATABASE_URL="postgresql://postgres:postgres@db:5432/fekm?schema=public"
AUTH_SECRET="votre-secret-32-caracteres-min"
JWT_SECRET="votre-jwt-secret"
NEXT_PUBLIC_APP_URL="https://kravmaga974.re"

# Optionnel: S3/MinIO pour les vidéos
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=kravmaga-videos
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123456
```

### SSL / HTTPS

Si vous avez un nom de domaine, le script configure automatiquement Let's Encrypt.

Pour ajouter un domaine plus tard :

```bash
certbot --nginx -d kravmaga974.re
```

### Backup automatique

Les backups sont automatiques (tous les jours à 2h) dans `/opt/krav-maga-974/backups/`.

Pour restaurer un backup :

```bash
# Lister les backups
ls -la /opt/krav-maga-974/backups/

# Restaurer
gunzip < backups/backup-20240220-020000.sql.gz | docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d fekm
```

## 📦 Structure Docker

```
┌─────────────────────────────────────┐
│  Nginx (reverse proxy + SSL)        │
│  Ports: 80, 443                     │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│  Next.js App (krav-maga-974)        │
│  Port: 3000                         │
│  - API REST                         │
│  - Frontend React                   │
└─────────────┬───────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌─────────┐
│PostgreSQL│ │ Redis │ │  MinIO  │
│  :5432 │ │ :6379 │ │ :9000   │
└───────┘ └───────┘ └─────────┘
```

## 🔒 Sécurité

Le script configure automatiquement :
- **UFW** : Firewall (ports 22, 80, 443, 3000)
- **Fail2Ban** : Protection brute-force SSH/Nginx
- **Nginx** : Headers de sécurité, rate limiting
- **Docker** : Réseau isolé, healthchecks

**Actions recommandées après déploiement :**
1. Changer les mots de passe des comptes de démo
2. Changer le secret MinIO (par défaut: minio/minio123456)
3. Configurer un mot de passe PostgreSQL fort
4. Désactiver les comptes de démo en production

## 🐛 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
docker-compose -f /opt/krav-maga-974/docker-compose.prod.yml logs app

# Redémarrer les services
krav-maga-974 restart
```

### Erreur de connexion à la DB

```bash
# Vérifier que la DB est prête
docker-compose -f /opt/krav-maga-974/docker-compose.prod.yml exec db pg_isready -U postgres

# Réinitialiser la DB (⚠️ perte de données)
docker-compose -f /opt/krav-maga-974/docker-compose.prod.yml down -v
docker-compose -f /opt/krav-maga-974/docker-compose.prod.yml up -d
```

### Problème de permissions

```bash
# Fixer les permissions
chown -R root:root /opt/krav-maga-974
chmod +x /opt/krav-maga-974/deploy-proxmox.sh
```

## 📊 Monitoring

```bash
# Statut des containers
docker ps

# Utilisation des ressources
docker stats

# Logs en temps réel
krav-maga-974 logs

# Espace disque
df -h
```

## 🔄 Mise à jour

```bash
# Mettre à jour l'application
krav-maga-974 update

# Ou manuellement
cd /opt/krav-maga-974
git pull origin master
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📞 Support

En cas de problème :
1. Vérifier les logs : `krav-maga-974 logs`
2. Vérifier le statut : `krav-maga-974 status`
3. Consulter le repo GitHub : https://github.com/tomwaro417/Krav-Maga-974
