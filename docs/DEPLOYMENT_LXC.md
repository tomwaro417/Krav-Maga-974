# 🥋 Déploiement LXC - Krav Maga 974

Ce guide explique comment déployer l'application sur un conteneur LXC Proxmox (approche légère sans Docker).

## 📋 Prérequis

- **Proxmox VE 7+**
- **Conteneur LXC** avec Debian 12 (Bookworm)
- **Ressources minimales** : 1 vCPU, 1GB RAM (512MB peut suffire pour test), 8GB disque

## 🚀 Création du conteneur LXC

### 1. Sur le node Proxmox, créer le conteneur :

```bash
# Télécharger le template si nécessaire
pveam update
pveam download local debian-12-standard_12.7-1_amd64.tar.zst

# Créer le conteneur
pct create 100 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
    --hostname kravmaga \
    --cores 1 \
    --memory 1024 \
    --swap 512 \
    --rootfs local-lvm:8 \
    --net0 name=eth0,bridge=vmbr0,ip=dhcp \
    --features nesting=1,keyctl=1 \
    --onboot 1 \
    --unprivileged 0

# Démarrer le conteneur
pct start 100

# Entrer dans le conteneur
pct exec 100 -- bash
```

### Options importantes :

| Option | Description |
|--------|-------------|
| `--features nesting=1` | Permet les containers dans le container (pour Docker si besoin) |
| `--features keyctl=1` | Nécessaire pour certaines apps Node.js |
| `--unprivileged 0` | Container privilégié (nécessaire pour systemd dans LXC) |

> **Note** : Pour un container **non-privilégié**, voir la section [LXC Non-privilégié](#lxc-non-privilégié) ci-dessous.

## 📦 Déploiement

### 2. Exécuter le script de déploiement

Dans le conteneur :

```bash
# Télécharger et exécuter
curl -fsSL https://raw.githubusercontent.com/tomwaro417/Krav-Maga-974/master/deploy-lxc.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh
```

Ou manuellement :

```bash
# Cloner
git clone https://github.com/tomwaro417/Krav-Maga-974.git /opt/krav-maga-974
cd /opt/krav-maga-974
chmod +x deploy-lxc.sh
./deploy-lxc.sh
```

Le script va :
- Installer Node.js 22, PostgreSQL 15, Redis, Nginx
- Cloner et build l'application
- Configurer PM2 pour le process management
- Mettre en place Nginx + SSL
- Configurer firewall et fail2ban
- Créer un service systemd

### 3. Accès

Après le déploiement :

- **Application** : http://<IP-du-container> ou https://<votre-domaine>
- **Comptes démo** :
  - Admin : `admin@example.com` / `admin123!`
  - User : `demo@example.com` / `demo123!`

## 🎛️ Commandes de Gestion

```bash
# Gestion de l'application
krav-maga-974 start       # Démarrer
krav-maga-974 stop        # Arrêter
krav-maga-974 restart     # Redémarrer
krav-maga-974 status      # Statut
krav-maga-974 logs        # Logs application
krav-maga-974 pm2-logs    # Logs PM2
krav-maga-974 pm2-monit   # Monitoring temps réel
krav-maga-974 update      # Mettre à jour
krav-maga-974 backup      # Backup DB
krav-maga-974 shell       # Shell dans l'app
krav-maga-974 db-shell    # Shell PostgreSQL
```

## 🔧 Commandes système

```bash
# Gestion via systemd
systemctl start krav-maga-974
systemctl stop krav-maga-974
systemctl restart krav-maga-974
systemctl status krav-maga-974

# Logs système
journalctl -u krav-maga-974 -f

# PM2 (direct)
pm2 status
pm2 logs krav-maga-974
pm2 monit
pm2 reload krav-maga-974

# PostgreSQL
sudo -u postgres psql -d fekm
pg_dump -U fekm_user -h localhost fekm > backup.sql

# Redis
redis-cli ping
redis-cli monitor
```

## 📊 Ressources utilisées

Typiquement sur LXC :

| Service | RAM | CPU | Notes |
|---------|-----|-----|-------|
| Next.js App | ~150-300MB | faible | Pic au build |
| PostgreSQL | ~100-200MB | faible | Selon données |
| Redis | ~10-50MB | négligeable | Cache |
| Nginx | ~10-20MB | négligeable | Reverse proxy |
| **Total** | **~300-600MB** | **faible** | En production |

## 🔒 LXC Non-privilégié

Si vous préférez un container **non-privilégié** (plus sécurisé) :

### 1. Création

```bash
pct create 100 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
    --hostname kravmaga \
    --cores 1 \
    --memory 1024 \
    --rootfs local-lvm:8 \
    --net0 name=eth0,bridge=vmbr0,ip=dhcp \
    --features nesting=1,keyctl=1 \
    --onboot 1 \
    --unprivileged 1
```

### 2. Configuration nécessaire sur le host Proxmox

Éditer `/etc/pve/lxc/100.conf` et ajouter :

```conf
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net/tun dev/net/tun none bind,create=file
lxc.apparmor.profile: unconfined
lxc.cgroup2.devices.allow: a
lxc.cap.drop:
```

Puis redémarrer le container :
```bash
pct stop 100 && pct start 100
```

### 3. Dans le container

Le script fonctionne mais sans systemd. Utiliser PM2 directement :

```bash
# Au lieu de systemctl
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 🔄 Mise à jour

```bash
# Commande simple
krav-maga-974 update

# Ou manuellement
cd /opt/krav-maga-974
git pull origin master
cd apps/web
pnpm install
pnpm prisma migrate deploy
pnpm build
pm2 reload krav-maga-974
```

## 💾 Backup et Restore

### Backup

```bash
# Backup automatique quotidien (configuré dans /etc/cron.daily/)
krav-maga-974 backup

# Backup manuel complet
tar czf /backups/kravmaga-$(date +%Y%m%d).tar.gz /opt/krav-maga-974
pg_dump -U fekm_user -h localhost fekm | gzip > /backups/db-$(date +%Y%m%d).sql.gz
```

### Restore

```bash
# Restore DB
gunzip < /backups/db-20240220.sql.gz | sudo -u postgres psql -d fekm

# Restore fichiers
tar xzf /backups/kravmaga-20240220.tar.gz -C /
```

## 🐛 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
krav-maga-974 logs
journalctl -u krav-maga-974 -n 50

# Vérifier PM2
pm2 status
pm2 logs

# Vérifier les services
systemctl status postgresql
systemctl status redis-server
systemctl status nginx
```

### Erreur de connexion PostgreSQL

```bash
# Vérifier que PostgreSQL écoute
sudo -u postgres psql -c "SHOW listen_addresses;"

# Vérifier pg_hba.conf
grep -E "^(host|local)" /etc/postgresql/15/main/pg_hba.conf

# Redémarrer
systemctl restart postgresql
```

### Erreur "Permission denied" sur les fichiers

```bash
# Fixer les permissions
chown -R root:root /opt/krav-maga-974
chmod -R 755 /opt/krav-maga-974
```

### Container LXC bloqué sur systemd

Si vous voyez des erreurs systemd dans LXC non-privilégié :

```bash
# Alternative sans systemd
apt-get install daemonize

cat > /etc/init.d/krav-maga-974 << 'EOF'
#!/bin/sh
### BEGIN INIT INFO
# Provides:          krav-maga-974
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Krav Maga 974
### END INIT INFO

case "$1" in
  start)
    cd /opt/krav-maga-974/apps/web && pm2 start ecosystem.config.js
    ;;
  stop)
    pm2 stop krav-maga-974
    ;;
  restart)
    pm2 reload krav-maga-974
    ;;
  *)
    echo "Usage: $0 {start|stop|restart}"
    exit 1
    ;;
esac
EOF

chmod +x /etc/init.d/krav-maga-974
update-rc.d krav-maga-974 defaults
```

## 🎯 Optimisations LXC

### Réduire l'empreinte mémoire

```bash
# Configurer PostgreSQL pour faible mémoire
cat >> /etc/postgresql/15/main/postgresql.conf << EOF
# Optimisations LXC faible mémoire
shared_buffers = 64MB
effective_cache_size = 128MB
maintenance_work_mem = 16MB
work_mem = 4MB
max_connections = 20
EOF

systemctl restart postgresql
```

### Activer le swap si nécessaire

```bash
# Créer un fichier swap (si pas de swap partition)
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Persister
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 📋 Récapitulatif des fichiers

| Fichier | Description |
|---------|-------------|
| `/opt/krav-maga-974/` | Code de l'application |
| `/opt/krav-maga-974/apps/web/.env` | Variables d'environnement |
| `/var/log/krav-maga-974/` | Logs de l'application |
| `/etc/nginx/sites-available/krav-maga-974` | Config Nginx |
| `/etc/systemd/system/krav-maga-974.service` | Service systemd |
| `/etc/postgresql/15/main/pg_hba.conf` | Config PostgreSQL auth |

## 📞 Support

En cas de problème :
1. Vérifier les logs : `krav-maga-974 logs`
2. Vérifier le statut des services : `systemctl status`
3. Consulter le repo : https://github.com/tomwaro417/Krav-Maga-974
