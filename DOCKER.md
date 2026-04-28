# 🐳 Docker — Quick Run Guide

Just copy each command. Run them one by one in your terminal.

---

## ✅ Step 1: Install Docker Desktop

Download from <https://www.docker.com/products/docker-desktop/> and install.
Then open **Docker Desktop** and wait for it to say "Engine running".

Verify:

```bash
docker --version
```

```bash
docker compose version
```

---

## ✅ Step 2: Open the project folder in terminal

```bash
cd c:/Users/Rabiul/Desktop/student-management
```

---

## ✅ Step 3: Make sure `.env` exists

The file `.env` should already be in the folder. If not, ask the developer for it.

---

## ✅ Step 4: Build & start the app

```bash
docker compose up -d --build
```

⏳ First time takes 3–5 minutes. Wait for it to finish.

---

## ✅ Step 5: Open the app

Open browser → <http://localhost:3000>

Login:
- Phone: `01776627800`
- Password: `amiadmin111`

---

## 🛑 To stop the app

```bash
docker compose down
```

---

## 🔄 To start again (after stopping)

```bash
docker compose up -d
```

---

## 🔁 After code changes — rebuild

```bash
docker compose up -d --build
```

---

## 👀 See what the app is doing (logs)

```bash
docker compose logs -f
```

Press **Ctrl + C** to stop watching (the app keeps running).

---

## 📊 Check if app is running

```bash
docker compose ps
```

---

## 🆘 Something is broken? Reset everything

```bash
docker compose down
```

```bash
docker compose build --no-cache
```

```bash
docker compose up -d
```

```bash
docker compose logs -f
```

---

## 💾 Quick Reference Card

| What you want | Command |
|---|---|
| Start app | `docker compose up -d --build` |
| Stop app | `docker compose down` |
| See logs | `docker compose logs -f` |
| Restart app | `docker compose restart` |
| Check status | `docker compose ps` |
| Full reset | `docker compose down && docker compose build --no-cache && docker compose up -d` |

---

## 📝 Notes

- Always make sure **Docker Desktop is running** before any command
- The app runs on **port 3000** — make sure nothing else is using it
- Database connection is in the `.env` file — never share it
- First build is slow (~3-5 min), next builds are fast (~30 sec)
