# Menu Management — Backend API

A RESTful backend API built with **Go (Gin)** and **MySQL** for hierarchical menu management. Supports CRUD operations, parent-child relationships, reordering, and moving menu items between nodes.

> 📦 **Full-stack setup**: See the [root README](../README.md) for Docker Compose instructions to run the entire stack (backend + frontend + database) with a single command.

---

## 🏗️ Architecture

```
cmd/server/         → Application entry point
internal/
  ├── config/       → Environment configuration
  ├── database/     → MySQL connection & migrations
  ├── model/        → Data models & DTOs
  ├── repository/   → Database queries (data layer)
  ├── service/      → Business logic (service layer)
  ├── handler/      → HTTP handlers (presentation layer)
  ├── middleware/    → Error handling & logging
  └── router/       → Route definitions & CORS
migrations/         → SQL migration files
docs/               → Generated Swagger/OpenAPI docs
```

**Design decisions:**
- **Layered architecture** (handler → service → repository) for separation of concerns
- **Flat DB table** with `parent_id` + `sort_order`; tree assembled in-memory for performance
- **`ON DELETE CASCADE`** on the FK — deleting a parent auto-removes all descendants
- **Transactional** move/reorder operations with sibling gap-closing
- **Interface-based** repository for easy unit testing with mocks

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | Go 1.23 |
| HTTP Framework | Gin |
| Database | MySQL 8.0 |
| DB Driver | sqlx + go-sql-driver/mysql |
| Validation | go-playground/validator |
| API Docs | Swagger/OpenAPI (swaggo) |
| Testing | testify |
| Hot Reload | Air |
| Containers | Docker + Docker Compose |

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

---

## 🚀 Getting Started (Local)

### Prerequisites

- Go 1.23+
- MySQL 8.0+ running locally

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your database credentials (set DB_HOST=localhost)
```

### Run in Development Mode

```bash
# Install dependencies
go mod download

# Generate Swagger docs
go install github.com/swaggo/swag/cmd/swag@latest
swag init -g cmd/server/main.go -o docs

# Run with hot-reload (requires Air)
go install github.com/air-verse/air@latest
air -c .air.toml

# Or run directly
go run ./cmd/server
```

Server starts at `http://localhost:8080`  
Swagger UI at `http://localhost:8080/swagger/index.html`

### Run Tests

```bash
# Run all tests
go test ./... -v -count=1

# Run with coverage report
go test ./... -coverprofile coverage.out -covermode atomic
go tool cover "-func=coverage.out"

# Generate HTML coverage report
go tool cover "-html=coverage.out" -o coverage.html
```

---

## 🐳 Docker

### Run Backend Only (Docker)

```bash
# Development with hot-reload
docker build -f Dockerfile.dev -t menu-backend-dev .
docker run -p 8080:8080 --env-file .env -v $(pwd):/app menu-backend-dev

# Production
docker build -t menu-backend .
docker run -p 8080:8080 --env-file .env menu-backend
```

### Run Full Stack (Recommended)

See the [root README](../README.md) for `docker-compose` commands that start the backend, frontend, and MySQL together.

---

## 📖 API Documentation

Interactive Swagger docs available at:  
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

Migrations are auto-applied on server startup from the `migrations/` directory.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | _(empty)_ | MySQL password |
| `DB_NAME` | `menu_db` | Database name |
| `SERVER_PORT` | `8080` | API server port |
| `APP_ENV` | `development` | Environment mode |

---

## 🐳 Docker Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage production build (~15MB Alpine image) |
| `Dockerfile.dev` | Development build with Air hot-reload |
| `.air.toml` | Air hot-reload configuration |
| `Makefile` | Common tasks (run, build, test, swagger, docker) |

---

## 📄 License

MIT
