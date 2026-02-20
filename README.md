# FEKM – Suivi des connaissances techniques (MVP solide)

Ce dépôt contient un **MVP solide** pour l’application FEKM :
- Référentiel hiérarchique **Ceinture → Module → Technique**
- Suivi de progression par utilisateur (**4 niveaux**)
- Vues : **Tableau de bord**, **Programme**, **À travailler**, **Recherche**
- Historique : **dernières techniques consultées**
- Admin : **import (avec dry-run)**, CRUD ceintures, édition contenus (Jaune/Orange), assignation vidéos coach
- Vidéos : **upload direct S3/MinIO** via URL présignée + liaisons (coach + utilisateur) + statut

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL (docker-compose)
- Auth : **session JWT en cookie httpOnly** (routes `/api/auth/*` + middleware)
- Upload : AWS SDK v3 (S3 ou MinIO en local)

## Démarrage rapide

### 1) Environnement
Copier `.env.example` en `.env` puis compléter :
- `DATABASE_URL`
- `AUTH_SECRET` (obligatoire en prod)
- optionnel : `S3_*` si tu veux activer l’upload

### 2) Lancer les services
À la racine :
```bash
docker compose up -d
```

### 3) Installer / DB / seed
```bash
cd apps/web
npm i
npx prisma db push
npx prisma db seed
npm run dev
```

### Comptes de démo (seed)
- `admin@example.com` / `admin123!` (ADMIN)
- `demo@example.com` / `demo123!` (USER)

## Import référentiel (FEKM)
- Endpoint : `POST /api/admin/import`
- Mode preview : `POST /api/admin/import?dryRun=1`
- Format : `apps/web/docs/import-format.md`
- Exemple prêt à importer : `apps/web/public/import/fekm-programs.json` (généré depuis les PDF fournis)

> ⚠️ Stratégie MVP : l’import **recrée** les modules/techniques de la ceinture (delete + create).  
> Les progressions utilisateurs restent, mais les IDs changent : à ajuster si tu veux une migration douce.

## Vidéos (S3/MinIO)
- `POST /api/videos/presign` → renvoie `uploadUrl` (PUT direct navigateur) + `assetId`
- `POST /api/videos/complete` → marque l’asset `READY` (MVP)
- `POST /api/videos/link-user` / `DELETE /api/videos/link-user` → associer/dissocier aux slots BEGINNER/PROGRESS
- `POST /api/videos/link-coach` / `DELETE /api/videos/link-coach` → associer/dissocier une vidéo coach

### Lecture vidéo
Le MVP conserve `status` + `storageKey`.  
Brancher un player (HLS/MP4) = étape suivante (CDN + URLs signées ou publique).

## Structure
- `apps/web` : Next.js (UI + API)
- `apps/web/prisma` : schéma + seed
- `apps/web/public/import` : exemple d’import FEKM
