# AyoType Repository Structure

This repository hosts **ayotype.com** and its projects with a scalable, multi-project architecture.

## 🏗️ Architecture Overview

```
emojifusion/
├── index.html                  # 🏠 Main landing page (ayotype.com)
├── app.html                    # 🎭 EmojiFusion app entry point
├── src/                        # EmojiFusion source code
│   ├── MobileApp-v2.tsx       # Main React component
│   ├── mobile-styles-v2.css   # App styles
│   ├── export.ts              # PNG export functionality
│   └── ...
├── public/                     # Public assets & sub-pages
│   ├── embed-widget.html      # Embeddable widget (standalone)
│   ├── embed-widget.js        # Widget script
│   ├── combo-archive.html     # Full archive page
│   ├── blog/                  # Blog posts
│   │   └── combo-of-the-day/  # Daily combo blog posts
│   └── social-posts/          # Social media content
├── combo-api-server.cjs       # REST API server (port 3002)
├── generate-combo-of-the-day.cjs  # Daily combo generator
├── generate-blog-post.cjs     # Blog content generator
├── combo-of-the-day.json      # Generated combo data
├── real-api.cjs               # Main API (Groq integration)
└── test-current-ui.py         # UI testing script

```

## 📄 Page Routes

| URL Path | File | Description |
|----------|------|-------------|
| `/` | `index.html` | Main ayotype.com landing page |
| `/app.html` | `app.html` | EmojiFusion full app |
| `/public/combo-archive.html` | `public/combo-archive.html` | Searchable archive |
| `/public/embed-widget.html` | `public/embed-widget.html` | Standalone widget |

## 🚀 Development

### Start Development Servers

```bash
# Terminal 1: Main app (port 3000)
npm run dev

# Terminal 2: API server (port 3001)
node real-api.cjs

# Terminal 3: Blog API server (port 3002)
node combo-api-server.cjs
```

### Generate Daily Content

```bash
# Generate today's combo
node generate-combo-of-the-day.cjs

# Generate blog post
node generate-blog-post.cjs
```

## 🌐 Deployment Structure

For production deployment, the structure supports:

1. **Main Domain** (`ayotype.com`):
   - Serves `index.html` as landing page
   - Projects link to sub-pages

2. **App Page** (`/app.html`):
   - Full EmojiFusion application
   - React + Vite build

3. **Blog Integration**:
   - Widget embedded on landing page
   - Archive page for browsing all combos
   - RSS feed at `/api/combo-of-the-day/rss`

4. **API Endpoints** (port 3002):
   - `GET /api/combo-of-the-day` - Today's combo
   - `GET /api/combo-of-the-day/:date` - Specific date
   - `GET /api/combo-of-the-day/latest` - Last 7 days
   - `GET /api/combo-of-the-day/archive` - All combos
   - `GET /api/combo-of-the-day/rss` - RSS feed

## 🔄 Adding New Projects

To add a new project to ayotype.com:

1. **Create project files** in a new directory (e.g., `project-name/`)
2. **Update `index.html`**:
   - Add a new card in the projects grid
   - Link to the project page
3. **Build & Deploy** the project
4. **Update navigation** and sitemap

### Example Project Card

```html
<a href="/project-name.html" class="project-card">
  <span class="project-icon">🎨</span>
  <h3>Project Name</h3>
  <p>Project description goes here.</p>
  <span class="project-badge">Live</span>
</a>
```

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy (copy dist/ to server)
```

## 🎯 Key Features

- ✅ Scalable multi-project structure
- ✅ Blog system with daily automation
- ✅ Embeddable widgets for external sites
- ✅ RSS feed support
- ✅ Responsive design
- ✅ SEO-friendly structure
- ✅ API-driven content

## 📝 Content Generation Workflow

1. **Daily Combo**: `generate-combo-of-the-day.cjs` → `combo-of-the-day.json`
2. **Blog Post**: `generate-blog-post.cjs` → Markdown + social media content
3. **API Serves**: `combo-api-server.cjs` reads JSON and serves via REST
4. **Landing Page**: Widget auto-fetches from API

## 🧪 Testing

```bash
# UI testing
python test-current-ui.py

# API testing
curl http://127.0.0.1:3002/api/combo-of-the-day
```

## 📚 Documentation

- **Blog System**: See `COMBO_OF_THE_DAY.md`
- **Python Setup**: See `INSTALL_PYTHON.md`
- **Claude Config**: See `.claude/README.md`

---

**Built with:** React, Vite, Node.js, Python (Playwright)
**Architecture:** Multi-project monorepo with shared resources
