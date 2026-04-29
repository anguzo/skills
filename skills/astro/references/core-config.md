---
name: core-config
description: Astro configuration options, build settings, and environment schema.
---

# Configuration

Astro is configured via `astro.config.mjs` (or `.js`, `.ts`). This file controls the build process, deployment target, integrations, and core behavior.

## Core Options

```javascript
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

export default defineConfig({
  // Deployment
  site: 'https://example.com',
  base: '/docs',
  output: 'server', // 'static' | 'server' | 'hybrid'
  adapter: node({ mode: 'standalone' }),
  
  // Integrations
  integrations: [react()],
  
  // URL and Path Handling
  trailingSlash: 'always', // 'always' | 'never' | 'ignore'
  
  // Style Strategy
  scopedStyleStrategy: 'class', // 'where' | 'class' | 'attribute'
  
  // Vite Passthrough
  vite: {
    optimizeDeps: { exclude: ['my-dep'] }
  }
});
```

## Build Settings

- `build.format`: `'file'` (e.g. `about.html`) or `'directory'` (e.g. `about/index.html`).
- `build.assets`: Name of directory for generated assets (default `_astro`).
- `build.inlineStylesheets`: Controls when CSS is inlined into the HTML.
- `build.concurrency`: Number of pages to build in parallel.

## Image Service

Configure how images are processed.

```javascript
export default defineConfig({
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
    domains: ['example.com'],
    remotePatterns: [{ protocol: 'https', hostname: '**.imgix.net' }]
  }
});
```

## Security and Environment

Astro provides built-in validation for environment variables and security headers.

```javascript
export default defineConfig({
  security: {
    checkOrigin: true // CSRF protection for on-demand pages
  },
  env: {
    schema: {
      API_KEY: envField.string({ context: 'server', access: 'secret' }),
      PUBLIC_ID: envField.string({ context: 'client', access: 'public' })
    }
  }
});
```

## Internationalization (i18n)

Handle multi-language routing and fallbacks.

```javascript
export default defineConfig({
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'redirect'
    }
  }
});
```

## Other Key Sections

- **Markdown**: `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.shikiConfig` for syntax highlighting.
- **Session**: `session.driver` and `session.cookie` for server-side sessions.
- **Prefetch**: `prefetch.defaultStrategy` for browser prefetching.
- **Fonts**: `fonts` configuration for optimized font loading.
- **Server**: `server.port` and `server.host` for the local development server.

<!--
Source references:
- https://docs.astro.build/en/reference/configuration-reference/
- https://docs.astro.build/en/guides/configuring-astro/
-->
