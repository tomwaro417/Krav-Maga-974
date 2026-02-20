# 🛠️ TOOLS.md - Environnement de Développement Web

## 🎯 Stack Technique Complète

### Runtime & Langages
| Outil | Version | Description |
|-------|---------|-------------|
| Node.js | v22.22.0 | Runtime JavaScript |
| Python | 3.12.3 | Backend, scripts, ML |
| TypeScript | 5.9.3 | JavaScript typé |

### Gestionnaires de Packages
| Outil | Commande | Usage |
|-------|----------|-------|
| **pnpm** | `pnpm` | Principal (rapide, efficace) |
| npm | `npm` | Fallback |
| pip | `pip3` | Packages Python |

### Frameworks & CLI Frontend
| Outil | Version | Usage |
|-------|---------|-------|
| **Vite** | 7.3.1 | Build tool moderne (recommandé) |
| **React** | 19.2.4 | Bibliothèque UI |
| **@angular/cli** | 21.1.4 | Framework Angular |
| **@vue/cli** | 5.0.9 | Framework Vue.js |

### Backend & API
| Outil | Version | Description |
|-------|---------|-------------|
| **Express** | 5.2.1 | Framework Node.js |
| **tsx** | 4.21.0 | Exécution TS directe (backend) |
| **jsonwebtoken** | 9.0.3 | Authentification JWT |
| **bcryptjs** | 3.0.3 | Hashage de mots de passe |
| **cors** | 2.8.6 | Gestion CORS |
| **dotenv** | 17.3.1 | Variables d'environnement |

### Outils de Développement
| Outil | Version | Description |
|-------|---------|-------------|
| **TypeScript** | 5.9.3 | Transpilateur TS → JS |
| **ts-node** | 10.9.2 | Exécution TS directe |
| **tsx** | 4.21.0 | Alternative rapide à ts-node |
| **nodemon** | 3.1.11 | Auto-reload dev server |
| **pm2** | 6.0.14 | Process manager production |
| **ESLint** | 9.39.2 | Linting |
| **Prettier** | 3.x | Formatage de code |

### CSS & Styling
| Outil | Version | Description |
|-------|---------|-------------|
| **Tailwind CSS** | 4.1.18 | Utility-first CSS |
| **PostCSS** | 8.5.6 | Transformation CSS |
| **Autoprefixer** | 10.4.24 | Préfixes CSS |

### Bases de Données & ORM
| Outil | Version | Description |
|-------|---------|-------------|
| **PostgreSQL Client** | 16.11 | Client psql |
| **Redis CLI** | 7.0.15 | Client Redis |
| **Prisma** | 7.4.0 | ORM moderne |
| **@prisma/client** | 7.4.0 | Client Prisma |
| **MongoDB** | - | À installer via Docker |

### Testing
| Outil | Version | Description |
|-------|---------|-------------|
| **Vitest** | 4.0.18 | Test runner rapide |
| **@testing-library/react** | 16.3.2 | Tests React |
| **@testing-library/jest-dom** | 6.9.1 | Matchers Jest |
| **jsdom** | 28.1.0 | Environnement DOM |

### Conteneurisation
| Outil | Version | Description |
|-------|---------|-------------|
| **Docker** | 29.2.1 | Conteneurisation |
| **Docker Compose** | - | Multi-conteneurs |

### API & Tests HTTP
| Outil | Version | Description |
|-------|---------|-------------|
| **httpie** | 3.2.2 | Client HTTP moderne |
| curl | 8.5.0 | Client HTTP classique |
| jq | 1.7 | Manipulation JSON |

### Version Control
| Outil | Description |
|-------|-------------|
| **git** | Version control |
| **gh** | GitHub CLI (connecté: tomwaro417) |

---

## 🚀 Démarrer un Projet

### React + Vite (Recommandé)
```bash
pnpm create vite@latest mon-projet -- --template react-ts
cd mon-projet
pnpm install
pnpm dev
```

### Utiliser le Template FullStack
```bash
cd templates/fullstack-template
pnpm install
pnpm server:dev   # Backend
pnpm dev          # Frontend (autre terminal)
```

### Next.js
```bash
pnpm create next-app@latest mon-projet
cd mon-projet
pnpm dev
```

### Vue.js
```bash
vue create mon-projet
# ou
pnpm create vue@latest
```

### Angular
```bash
ng new mon-projet
cd mon-projet
ng serve
```

### API Node.js + Express
```bash
mkdir mon-api && cd mon-api
pnpm init
pnpm add express cors dotenv
pnpm add -D @types/express @types/node nodemon typescript tsx
```

---

## 🗄️ Bases de Données avec Docker

### PostgreSQL
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  postgres:16

# Connexion
psql -h localhost -U dev -d myapp
```

### Redis
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Connexion
redis-cli
```

### MongoDB
```bash
docker run -d \
  --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=adminpass \
  -p 27017:27017 \
  mongo:7
```

---

## 📡 Commandes HTTP Utiles

### httpie (préféré)
```bash
# GET
http GET api.example.com/users

# POST avec JSON
http POST api.example.com/users name="John" email="john@example.com"

# Avec headers
http GET api.example.com/protected Authorization:"Bearer TOKEN"

# Avec query params
http GET api.example.com/search q==react limit==10
```

### curl (classique)
```bash
curl -X GET https://api.example.com/users
curl -X POST -H "Content-Type: application/json" -d '{"name":"John"}' https://api.example.com/users
```

---

## 🧪 Testing

```bash
# Lancer les tests
pnpm test

# Mode watch
pnpm test -- --watch

# Avec UI
pnpm test:ui

# Coverage
pnpm test -- --coverage
```

---

## 📝 Scripts Package.json Recommandés

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "server": "tsx server/src/index.ts",
    "server:dev": "tsx watch server/src/index.ts"
  }
}
```

---

## 🔒 Configuration Git

```bash
# Repos privés par défaut
git config --global gh.repo.create.visibility private
git config --global init.defaultBranch main

# GitHub CLI
git config --global gh.protocol ssh

# Git user (à configurer)
git config --global user.name "Ton Nom"
git config --global user.email "ton@email.com"
```

---

## 📚 Ressources

- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [Express.js](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

---

*Dernière mise à jour: 2026-02-17*
