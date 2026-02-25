# Menu Management — Full-Stack Application

A full-stack **hierarchical menu management** system with a Go REST API backend and a React TypeScript frontend. Supports CRUD operations, parent-child relationships, drag-and-drop reordering, and tree visualization.

---

## 🎬 Video Demo

▶️ [Watch the full demo on Google Drive](https://drive.google.com/file/d/1-ZCBiXPd2gsxZqqxzcyg-I4TfYnEvyT1/view?usp=sharing)

---

## 🏗️ Architecture Overview

```
menu-project/
├── backend-menu/          # Go REST API (Gin + MySQL)
│   ├── cmd/server/        # Application entry point
│   ├── internal/          # Layered architecture (handler → service → repository)
│   ├── migrations/        # SQL migration files (auto-applied)
│   ├── docs/              # Swagger/OpenAPI generated docs
│   ├── Dockerfile         # Multi-stage production build (~15MB)
│   └── Dockerfile.dev     # Development build with Air hot-reload
│
├── frontend-menu/         # React SPA (Vite + Tailwind)
│   ├── src/               # Components, store, API layer, types
│   ├── nginx.conf         # Production Nginx config with API proxy
│   ├── Dockerfile         # Multi-stage production build (Nginx)
│   └── Dockerfile.dev     # Development build with Vite hot-reload
│
├── docker-compose.yml     # Production: MySQL + Backend + Frontend
├── docker-compose.dev.yml # Development: hot-reload for both services
└── .env.example           # All environment variables
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Go 1.23, Gin | REST API with layered architecture |
| **Database** | MySQL 8.0 | Relational data with hierarchical FK |
| **Frontend** | React 19, TypeScript 5 | Component-based UI |
| **Build Tool** | Vite 7 | Fast dev server and bundling |
| **State** | Zustand | Lightweight menu tree state |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **API Docs** | Swagger/OpenAPI | Auto-generated from code annotations |
| **Containers** | Docker + Docker Compose | Unified dev/prod environments |

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Clone & Configure

```bash
git clone <repository-url>
cd menu-project

# Copy environment template
cp .env.example .env
# Edit .env if needed (defaults work out of the box)
```

### 2. Run in Development Mode (Hot-Reload)

```bash
docker compose -f docker-compose.dev.yml up --build
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | [http://localhost:5173](http://localhost:5173) |
| Backend API | [http://localhost:8080](http://localhost:8080) |
| Swagger Docs | [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html) |
| MySQL | `localhost:3306` |

- ✅ **Backend**: Air watches Go files and auto-rebuilds on save
- ✅ **Frontend**: Vite HMR updates the browser instantly on save
- ✅ **Database**: Persistent volume retains data across restarts

```bash
# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop all services
docker compose -f docker-compose.dev.yml down
```

### 3. Run in Production Mode

```bash
docker compose up --build -d
```

| Service | URL |
|---------|-----|
| Frontend (Nginx) | [http://localhost](http://localhost) |
| Backend API | [http://localhost:8080](http://localhost:8080) |
| Swagger Docs | [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html) |

- ✅ **Backend**: Optimized multi-stage build (~15MB Alpine image)
- ✅ **Frontend**: Built assets served via Nginx with gzip & caching
- ✅ **Nginx** proxies `/api/` requests to backend automatically

```bash
# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove all data (including database)
docker compose down -v
```

---

## 🖥️ Running Without Docker (Local)

### Backend

```bash
cd backend-menu

# Prerequisites: Go 1.23+, MySQL 8.0+ running locally

# Configure
cp .env.example .env
# Edit .env — set DB_HOST=localhost and your MySQL credentials

# Install dependencies
go mod download

# Generate Swagger docs
go install github.com/swaggo/swag/cmd/swag@latest
swag init -g cmd/server/main.go -o docs

# Run
go run ./cmd/server
```

Backend runs at `http://localhost:8080`

### Frontend

```bash
cd frontend-menu

# Prerequisites: Node.js >= 18, npm >= 9

# Install dependencies
npm install

# Configure
cp .env.example .env
# Default: VITE_API_BASE_URL=http://localhost:8080/api

# Run dev server
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/menus` | Get all menus (tree structure) |
| `GET` | `/api/menus/:id` | Get single menu with children |
| `POST` | `/api/menus` | Create new menu item |
| `PUT` | `/api/menus/:id` | Update menu name/description |
| `DELETE` | `/api/menus/:id` | Delete menu (cascade children) |
| `PATCH` | `/api/menus/:id/move` | Move to different parent |
| `PATCH` | `/api/menus/:id/reorder` | Reorder within same level |
| `GET` | `/health` | Health check |
| `GET` | `/swagger/*` | Swagger UI |

### Swagger / OpenAPI

Once the backend is running, interactive API docs are available at:  
**[http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)**

### Example Requests

```bash
# Create a root menu
curl -X POST http://localhost:8080/api/menus \
  -H "Content-Type: application/json" \
  -d '{"name": "Main Menu", "description": "Top-level menu"}'

# Create a child menu
curl -X POST http://localhost:8080/api/menus \
  -H "Content-Type: application/json" \
  -d '{"name": "Sub Menu", "parent_id": 1}'

# Get all menus (tree)
curl http://localhost:8080/api/menus

# Move a menu item
curl -X PATCH http://localhost:8080/api/menus/3/move \
  -H "Content-Type: application/json" \
  -d '{"parent_id": 2}'

# Reorder a menu item
curl -X PATCH http://localhost:8080/api/menus/3/reorder \
  -H "Content-Type: application/json" \
  -d '{"sort_order": 0}'

# Delete a menu (cascades to children)
curl -X DELETE http://localhost:8080/api/menus/1
```

---

## 📁 Database Schema

```sql
CREATE TABLE menus (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id   BIGINT UNSIGNED NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE CASCADE
);
```

Migrations are auto-applied on backend startup from the `migrations/` directory.

---

## 🐳 Docker Configuration

| File | Purpose |
|------|---------|
| `docker-compose.yml` | **Production**: API + Frontend (Nginx) + MySQL |
| `docker-compose.dev.yml` | **Development**: API (Air hot-reload) + Frontend (Vite HMR) + MySQL |
| `.env.example` | All environment variables in one place |
| `backend-menu/Dockerfile` | Multi-stage production build (~15MB image) |
| `backend-menu/Dockerfile.dev` | Development build with Air hot-reload |
| `frontend-menu/Dockerfile` | Multi-stage production build (Nginx) |
| `frontend-menu/Dockerfile.dev` | Development build with Vite hot-reload |
| `frontend-menu/nginx.conf` | Nginx config with API reverse proxy |

### Environment Variables

| Variable | Default | Used By |
|----------|---------|---------|
| `MYSQL_ROOT_PASSWORD` | `secret` | MySQL container |
| `MYSQL_DATABASE` | `menu_db` | MySQL container |
| `DB_HOST` | `db` | Backend |
| `DB_PORT` | `3306` | Backend |
| `DB_USER` | `root` | Backend |
| `DB_PASSWORD` | `secret` | Backend |
| `DB_NAME` | `menu_db` | Backend |
| `SERVER_PORT` | `8080` | Backend |
| `APP_ENV` | `development` | Backend |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Frontend |

### Volumes

| Volume | Purpose |
|--------|---------|
| `mysql_data` / `mysql_data_dev` | Persistent MySQL data across restarts |
| `./backend-menu` (dev) | Source code mount for Go hot-reload |
| `./frontend-menu` (dev) | Source code mount for Vite HMR |

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend-menu
go test ./... -v -count=1

# Backend tests with coverage
go test ./... -coverprofile coverage.out -covermode atomic
go tool cover "-func=coverage.out"

# Backend tests with HTML coverage report
go tool cover "-html=coverage.out" -o coverage.html

# Frontend tests
cd frontend-menu
npm test

# Frontend tests with coverage
npm run test:coverage
```

---

## 📄 License

MIT
