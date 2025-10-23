# AyoType Monorepo Restructuring Plan

## Overview
Consolidate GitHub and Vercel under unified ayotype structure with multi-domain support.

## Current State
- **Repo**: `mariusgm/emojifusion`
- **Vercel Projects**: `ayotype-landing` + `emojifusion` (separate)
- **Domains**: ayotype.com, emojifusion.ayotype.com

## Target State
- **Repo**: `mariusgm/ayotype` (new, clean)
- **Vercel Project**: Single `ayotype` project
- **Domains**: All served from one project with routing

## Directory Structure

```
ayotype/
├── apps/
│   ├── landing/                    # ayotype.com
│   │   ├── index.html
│   │   ├── contact.html
│   │   ├── blog/
│   │   │   └── combo-of-the-day/
│   │   └── styles/
│   │
│   ├── emojifusion/                # emojifusion.ayotype.com
│   │   ├── index.html             (renamed from app.html)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── fusion.ts
│   │   │   ├── cache.ts
│   │   │   └── ...
│   │   ├── api/
│   │   │   └── generate.ts
│   │   ├── public/
│   │   │   ├── embed-widget.html
│   │   │   ├── embed-widget.js
│   │   │   ├── combo-archive.html
│   │   │   └── manifest.webmanifest
│   │   └── vite.config.ts
│   │
│   └── [future-apps]/
│
├── shared/                         # Shared across all apps
│   ├── styles/
│   ├── components/
│   └── utils/
│
├── scripts/                        # Build and deploy scripts
│   └── pwa-hint.js
│
├── .claude/                        # Claude Code config
├── vercel.json                     # Multi-domain routing
├── package.json                    # Root package.json
└── README.md
```

## File Mapping

### Landing (ayotype.com)
```
CURRENT                              → TARGET
./index.html                         → apps/landing/index.html
./public/index.html                  → (DELETE - duplicate)
./contact.html                       → apps/landing/contact.html
./public/blog/                       → apps/landing/blog/
./public/social-posts/               → apps/landing/social-posts/
```

### EmojiFusion (emojifusion.ayotype.com)
```
CURRENT                              → TARGET
./app.html                           → apps/emojifusion/index.html
./src/**/*                           → apps/emojifusion/src/**/*
./api/generate.ts                    → apps/emojifusion/api/generate.ts
./public/embed-widget.*              → apps/emojifusion/public/embed-widget.*
./public/combo-archive.html          → apps/emojifusion/public/combo-archive.html
./public/manifest.webmanifest        → apps/emojifusion/public/manifest.webmanifest
./public/sw.js                       → apps/emojifusion/public/sw.js
./vite.config.ts                     → apps/emojifusion/vite.config.ts
```

### Root Files
```
CURRENT                              → TARGET
./package.json                       → ./package.json (update)
./tsconfig.json                      → ./tsconfig.json
./.gitignore                         → ./.gitignore
./vercel.json                        → ./vercel.json (rewrite)
./.claude/**/*                       → ./.claude/**/*
./scripts/**/*                       → ./scripts/**/*
./README.md                          → ./README.md (update)
```

## Vercel Configuration

### New vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/api/generate",
      "destination": "/apps/emojifusion/api/generate.ts",
      "has": [
        {
          "type": "host",
          "value": "emojifusion.ayotype.com"
        }
      ]
    },
    {
      "source": "/(.*)",
      "destination": "/apps/emojifusion/$1",
      "has": [
        {
          "type": "host",
          "value": "emojifusion.ayotype.com"
        }
      ]
    },
    {
      "source": "/contact",
      "destination": "/apps/landing/contact.html"
    },
    {
      "source": "/blog/(.*)",
      "destination": "/apps/landing/blog/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/apps/landing/$1"
    }
  ]
}
```

## Migration Steps

1. ✅ Archive old repos (mariusgm/ayotype, mariusgm/ayotype-43)
2. ✅ Create new repo mariusgm/ayotype
3. ✅ Create monorepo directory structure
4. ✅ Move files to new structure
5. ✅ Update package.json, vercel.json, configs
6. ✅ Test locally
7. ✅ Push to new repo
8. ✅ Configure Vercel project
9. ✅ Update domain settings
10. ✅ Deploy and verify

## Rollback Plan

- Keep `mariusgm/emojifusion` intact until verification complete
- Vercel projects remain active during migration
- Can revert domains to old projects if issues arise
