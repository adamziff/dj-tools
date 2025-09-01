# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production application
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### MCP Server (Browser Automation)
- `pnpm mcp:browser` - Start MCP browser automation server
- `pnpm playwright:install` - Install Chromium for Playwright
- `pnpm mcp:smoke` - Run MCP smoke tests

### Memento Scripts
- `pnpm memento:assets` - Generate test assets for Memento
- `pnpm mcp:memento-flow` - Run MCP Memento flow
- `pnpm mcp:memento-templates` - Generate Memento templates
- `pnpm memento:local-compose` - Run local composition for Memento

## Architecture

This is a Next.js 15 application with two main features:

### 1. Playlist Converter (`/converter`)
Converts DJ playlists (m3u8 and .crate files) to Spotify playlists:
- **Frontend**: React components with file upload, Spotify authentication, and playlist management
- **Backend**: API routes for Spotify OAuth, search, and playlist creation
- **File Processing**: Handles both m3u8 and Serato .crate file formats
- **Spotify Integration**: Uses Spotify Web API for authentication and playlist operations

### 2. Memento System (`/memento`)  
Generates DJ set memory cards with photos and tracklists:
- **Types**: Core types defined in `app/(ui)/memento/types.ts`
- **Templates**: SVG-based templates in `app/(ui)/memento/render/templates.ts` (portrait, landscape, square formats)
- **Rendering**: Server-side image composition using Sharp and SVG in `app/api/memento/render/route.ts`
- **Components**: React UI for metadata editing, template selection, and live preview

### MCP Browser Server
Model Context Protocol server for browser automation:
- **Server**: `mcp/browser-use-server.ts` - Playwright-based server
- **Configuration**: `mcp.config.json` declares server entry
- **Tools**: navigate, screenshot, click, fill, wait_for, evaluate, etc.
- **Usage**: Set `HEADLESS=true` environment variable for headless mode

### Key Patterns
- App Router structure with route groups: `(ui)` for pages
- API routes in `app/api/` for backend functionality  
- TypeScript throughout with strict typing
- Tailwind CSS + shadcn/ui components
- Server-side rendering with Sharp for image processing
- Environment-based configuration for OAuth and external services

### UI Framework
- **Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with dark mode support
- **Drag & Drop**: @dnd-kit for reorderable lists