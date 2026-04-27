# 🐳 Docker Guide

Run the Madrasa Management System inside Docker — anywhere, with one command.

---

## Prerequisites

Install **Docker Desktop** on your machine:
- **Windows**: <https://www.docker.com/products/docker-desktop/>
- **Mac**: <https://www.docker.com/products/docker-desktop/>
- **Linux**: <https://docs.docker.com/engine/install/>

After installation, verify:

```bash
docker --version
# Docker version 24.x or newer

docker compose version
# Docker Compose version v2.x or newer
```

Make sure Docker Desktop is **running** before any command below.

---

## ⚡ Quick Start (TL;DR)

```bash
# From the project root
docker compose up -d --build
```

That's it. Visit **<http://localhost:3000>**.

To stop:

```bash
docker compose down
```

---

## 🛠️ Setup (One-time)

### 1. Make sure `.env` exists

The container reads database credentials and other secrets from `.env` at the project root. It should look like:

```env
DATABASE_URL="postgresql://..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="student_management"
JWT_SECRET="..."
```

> ⚠️ Never commit `.env` to Git. It's already in `.gitignore` and `.dockerignore`.

### 2. Build the image

```bash
docker compose build
```

The first build takes ~3-5 minutes (downloading Node, building Next.js, generating Prisma client). Subsequent builds are much faster (~30 seconds) thanks to layer caching.

### 3. Start the container

```bash
docker compose up -d
```

- `up` → start the service
- `-d` → detached (runs in background)

The container will:
1. Apply pending Prisma migrations
2. Start the Next.js server on port 3000

Visit **<http://localhost:3000>** ✅

---

## 📋 Common Commands

### Start / Stop

```bash
# Start (uses already-built image)
docker compose up -d

# Build + start
docker compose up -d --build

# Stop (keeps the container)
docker compose stop

# Stop AND remove the container
docker compose down

# Rebuild + restart after code changes
docker compose up -d --build
```

### View logs

```bash
# Live logs (Ctrl+C to stop watching, container keeps running)
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100
```

### Get a shell inside the container

```bash
docker compose exec app sh

# Inside the container you can run:
ls
npx prisma studio   # opens visual DB editor at port 5555
exit
```

### Run a one-off command in the container

```bash
# Apply migrations manually
docker compose exec app npx prisma migrate deploy

# Seed admin accounts (only if needed; happens automatically on rebuild)
docker compose exec app npm run seed

# Check Prisma status
docker compose exec app npx prisma migrate status
```

### Restart

```bash
docker compose restart
```

### See container status

```bash
docker compose ps
```

---

## 🔄 Workflow After Code Changes

```bash
# 1. Make code changes locally

# 2. Rebuild and restart
docker compose up -d --build

# 3. Watch logs to verify it started cleanly
docker compose logs -f
```

If you only changed `.env`, no rebuild needed — just restart:

```bash
docker compose restart
```

---

## 🧹 Cleanup

```bash
# Stop & remove the container (keeps image)
docker compose down

# Stop & remove container + image
docker compose down --rmi all

# Nuclear option: remove ALL unused Docker stuff (be careful!)
docker system prune -a
```

---

## 🚀 Production Deployment

### Option 1: Direct Docker on a VM

```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Clone the repo
git clone <repo-url>
cd student-management

# 3. Copy .env (with PRODUCTION credentials)
nano .env
# Paste production DATABASE_URL, JWT_SECRET, etc.

# 4. Build and run
docker compose up -d --build

# 5. Set up a reverse proxy (Nginx) to point your domain to localhost:3000
```

### Option 2: Push image to registry

```bash
# Tag the image
docker tag student-management-app yourusername/madrasa-app:latest

# Push to Docker Hub
docker push yourusername/madrasa-app:latest

# On the server, pull and run
docker pull yourusername/madrasa-app:latest
docker run -d --env-file .env -p 3000:3000 yourusername/madrasa-app:latest
```

### Option 3: Deploy to a managed Container service

The image works on:
- **Google Cloud Run** (easiest, scales to zero)
- **AWS Fargate**
- **DigitalOcean App Platform**
- **Azure Container Apps**
- **Railway**, **Render**, **Fly.io**

Each accepts a `Dockerfile` directly.

---

## 🐛 Troubleshooting

### Container exits immediately

```bash
docker compose logs
```

Most common causes:
- ❌ `.env` is missing or has wrong `DATABASE_URL`
- ❌ Database is unreachable (check your Neon DB is awake)
- ❌ Migrations failed (check the log message)

### Port 3000 already in use

```bash
# Find what's using port 3000
# Windows:
netstat -ano | findstr :3000
# Mac/Linux:
lsof -i :3000

# Either stop that process, OR change the port in docker-compose.yml:
# ports:
#   - "3001:3000"   # host:container
```

### Prisma errors about missing engine

The image already includes OpenSSL and the Prisma engine. If you see this error, rebuild without cache:

```bash
docker compose build --no-cache
docker compose up -d
```

### "permission denied" on `docker-entrypoint.sh`

Make sure the script is executable. On Windows it might lose the executable bit. Run:

```bash
git update-index --chmod=+x docker-entrypoint.sh
git commit -m "make entrypoint executable"
```

### Image is too big

The build uses multi-stage to keep it small (~250-300 MB final). If yours is bigger, check `.dockerignore` is being honored and run:

```bash
docker compose build --no-cache
```

---

## 🔒 Security Tips

- ✅ Never commit `.env` to Git
- ✅ Use a unique, long `JWT_SECRET` per environment
- ✅ Keep your Neon DB connection string private
- ✅ The container runs as a **non-root user** (`nextjs`) for safety
- ✅ Use HTTPS in production (set up Nginx + Let's Encrypt or Cloudflare)

---

## 📦 What's in the Image

| Layer | Size | Contents |
|---|---|---|
| Base | ~50 MB | `node:20-alpine` + OpenSSL |
| Standalone Next.js | ~80 MB | The app server |
| Static files | ~5 MB | CSS, JS, images, fonts |
| Public assets | ~1 MB | Banner, font files |
| Prisma CLI + client | ~120 MB | For migrations + queries |
| **Total** | **~250-300 MB** | |

---

## 📁 Docker-Related Files

| File | Purpose |
|---|---|
| `Dockerfile` | 3-stage build instructions |
| `docker-compose.yml` | One-command run config |
| `docker-entrypoint.sh` | Runs migrations then starts server |
| `.dockerignore` | Files to exclude from the image |
| `next.config.ts` | Has `output: "standalone"` for Docker |

---

## 💡 Quick Reference

| Task | Command |
|---|---|
| Build & run | `docker compose up -d --build` |
| Stop | `docker compose down` |
| View logs | `docker compose logs -f` |
| Shell inside | `docker compose exec app sh` |
| Run migrations | `docker compose exec app npx prisma migrate deploy` |
| Seed admins | `docker compose exec app npm run seed` |
| Restart | `docker compose restart` |
| Status | `docker compose ps` |

---

Need more help? Check the main [`README.md`](./README.md) for project-level info.
