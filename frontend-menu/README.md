# Menu Management — Frontend

A modern React TypeScript frontend for the Menu Management REST API. Features hierarchical tree display, CRUD operations, expand/collapse, search, and responsive design.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-blue?logo=tailwindcss)

> 📦 **Full-stack setup**: See the [root README](../README.md) for Docker Compose instructions to run the entire stack (backend + frontend + database) with a single command.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI Framework | React 19 | Component-based UI |
| Language | TypeScript 5 | Type safety |
| Build Tool | Vite 7 | Fast dev server and bundling |
| State Management | Zustand | Lightweight store for menu tree state |
| HTTP Client | Axios | API communication with typed responses |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Notifications | React Hot Toast | User-friendly toast messages |
| Icons | React Icons | HeroIcons set |

### Folder Structure

```
src/
├── api/                    # Axios API service layer
│   └── menuApi.ts
├── components/
│   ├── layout/             # Layout components (Sidebar, Layout)
│   ├── menu/               # Menu feature components
│   │   ├── MenuPage.tsx    # Main page (assembles all menu components)
│   │   ├── MenuTree.tsx    # Tree container with expand/collapse
│   │   ├── MenuTreeItem.tsx# Recursive tree node
│   │   ├── MenuDetail.tsx  # Right panel: view/edit selected menu
│   │   ├── MenuDropdown.tsx# Root menu selector
│   │   └── CreateMenuModal.tsx
│   └── ui/                 # Reusable UI primitives
├── store/                  # Zustand state management
│   └── useMenuStore.ts
├── types/                  # TypeScript interfaces
│   └── menu.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## 🚀 Getting Started (Local)

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Backend API** running at `http://localhost:8080` (see [Backend README](../backend-menu/README.md))

### 1. Install Dependencies

```bash
cd frontend-menu
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` to set the backend API URL:

```
VITE_API_BASE_URL=http://localhost:8080/api
```

### 3. Run in Development Mode

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Hot-reloading is enabled.

### 4. Production Build

```bash
npm run build
npm run preview
```

---

## 🐳 Docker

### Run Frontend Only (Docker)

```bash
# Development with hot-reload
docker build -f Dockerfile.dev -t menu-frontend-dev .
docker run -p 5173:5173 -v $(pwd)/src:/app/src menu-frontend-dev

# Production (Nginx)
docker build -t menu-frontend .
docker run -p 80:80 menu-frontend
```

### Run Full Stack (Recommended)

See the [root README](../README.md) for `docker-compose` commands that start the frontend, backend, and MySQL together.

---

## 🧪 Running Tests

Unit tests use **Vitest** + **React Testing Library**.

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📋 API Endpoints Consumed

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menus` | Fetch all menus (tree) |
| GET | `/api/menus/:id` | Fetch menu by ID |
| POST | `/api/menus` | Create new menu |
| PUT | `/api/menus/:id` | Update menu name/desc |
| DELETE | `/api/menus/:id` | Delete menu (cascade) |
| PATCH | `/api/menus/:id/move` | Move menu to new parent |
| PATCH | `/api/menus/:id/reorder` | Reorder among siblings |

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Backend API base URL |

---

## 🐳 Docker Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage production build (Nginx) |
| `Dockerfile.dev` | Development build with Vite hot-reload |
| `nginx.conf` | Nginx config with API reverse proxy & gzip |
| `.dockerignore` | Files excluded from Docker context |

---

## 📄 License

MIT
