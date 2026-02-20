# FEKM – Suivi des connaissances techniques (starter MVP)

Ce dépôt est un **starter** pour développer l’application décrite dans le cahier des charges :
- Référentiel hiérarchique **Ceinture → Module → Technique**
- Suivi de progression par utilisateur (**4 niveaux**)
- Recherche + filtres (MVP)
- Espace admin (CRUD + import)
- Squelette “vidéos” (assets + liaisons + statuts)

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL (docker-compose)
- API REST via `app/api/*` (route handlers)

> Auth + upload S3 + transcodage : fournis sous forme de **points d’extension** (stubs) à brancher avec ton fournisseur (Clerk/Auth0/NextAuth, AWS S3, etc.).

## Démarrage rapide
1) Copier `.env.example` en `.env` et renseigner `DATABASE_URL`
2) Lancer Postgres :
```bash
docker compose up -d
```
3) Installer et migrer :
```bash
cd apps/web
npm i
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Structure
- `apps/web` : Next.js (UI + API)
- `apps/web/prisma` : schéma + migrations + seed

## Import référentiel
- Endpoint: `POST /api/admin/import` (JSON)
- Format proposé : voir `apps/web/docs/import-format.md`
