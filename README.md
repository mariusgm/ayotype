# AyoType

> Creative digital tools platform

AyoType is a monorepo containing multiple creative digital tools accessible through ayotype.com and its subdomains.

## Projects

### 🎭 EmojiFusion
**URL**: https://emojifusion.ayotype.com

AI-powered emoji and ASCII art generator. Create unique combinations with different tones and styles powered by Gemini 1.5 Pro.

**Features:**
- Adaptive line mode (AI chooses optimal layout)
- Multiple tones: cute, cool, chaotic
- Combo, Emoji-only, or ASCII-only modes
- Daily "Combo of the Day" blog
- Embeddable widget

### 🏠 Landing Page
**URL**: https://ayotype.com

Main landing page showcasing all AyoType projects with integrated blog.

## Repository Structure

```
ayotype/
├── apps/
│   ├── landing/              # ayotype.com
│   │   ├── index.html
│   │   ├── contact.html
│   │   └── blog/
│   │
│   ├── emojifusion/          # emojifusion.ayotype.com
│   │   ├── index.html
│   │   ├── src/
│   │   ├── api/
│   │   └── public/
│   │
│   └── [future-apps]/
│
├── shared/                   # Shared across all apps
├── scripts/                  # Build scripts
├── vite.config.ts            # Root Vite config
├── vercel.json               # Multi-domain deployment config
└── package.json              # Root package.json
```

## Development

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
# Clone repository
git clone https://github.com/mariusgm/ayotype.git
cd ayotype

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys (GROQ_API_KEY, GEMINI_API_KEY)
```

### Development Servers

```bash
# Start both API and UI dev servers
npm run dev

# Start only UI server
npm run dev:ui

# Start only API server
npm run dev:api

# Start specific app
npm run dev:landing
npm run dev:emojifusion
```

### Building

```bash
# Build all apps
npm run build

# Build specific app
npm run build:landing
npm run build:emojifusion

# Preview production build
npm run preview
```

### Testing

```bash
# Test API endpoint
npm run test:api

# Open browser for manual testing
npm run test:browser

# System health check
npm run doctor
```

## Deployment

### Vercel (Production)

The project is configured for multi-domain deployment on Vercel:

- `ayotype.com` → Landing page
- `emojifusion.ayotype.com` → EmojiFusion app

```bash
# Deploy to production
vercel --prod

# Preview deployment
vercel
```

### Environment Variables

Required for deployment:

- `GROQ_API_KEY` - Groq API key (fallback)
- `GEMINI_API_KEY` - Google Gemini API key (primary)
- `SENDGRID_API_KEY` - SendGrid for contact form
- `CONTACT_EMAIL` - Email for contact form submissions

## Project Domains

| Domain | App | Description |
|--------|-----|-------------|
| ayotype.com | Landing | Main site + blog |
| emojifusion.ayotype.com | EmojiFusion | Emoji generator |
| [future].ayotype.com | TBD | Future projects |

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build**: Vite 5.4
- **Deployment**: Vercel Edge Functions
- **AI**: Gemini 1.5 Pro, Groq Llama 3.3 70B
- **Styling**: CSS-in-JS

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © Marius Mevold

## Links

- [Main Site](https://ayotype.com)
- [EmojiFusion](https://emojifusion.ayotype.com)
- [Contact](https://ayotype.com/contact)
- [Bluesky](https://bsky.app/profile/ayotype.bsky.social)
