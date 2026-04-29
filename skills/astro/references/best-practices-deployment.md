---
name: best-practices-deployment
description: Deployment strategies, i18n routing, prefetching, and testing patterns for Astro.
---

# Deployment and Operations Best Practices

Astro supports both Static Site Generation (SSG) and Server-Side Rendering (SSR) through adapters.

## Adapters and Deployment

Choose an adapter based on your target environment. Static sites require no adapter and output to `dist/`.

- `@astrojs/node`: Standalone server or middleware.
- `@astrojs/cloudflare`: Workers or Pages.
- `@astrojs/vercel`: Serverless or Edge.

### Docker Pattern
For Node.js deployments, use a multi-stage build to minimize the production image size.

```dockerfile
FROM node:lts AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:lts-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV HOST=0.0.0.0 PORT=4321
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
```

## i18n Routing

Configure locales and routing behavior in `astro.config.mjs`.

```js
export default defineConfig({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'es'],
    routing: { prefixDefaultLocale: false }
  }
});
```

Use `getRelativeLocaleUrl(locale, path)` to generate localized links. Access `Astro.currentLocale` in components to detect the active locale.

## Testing Strategy

### Component Testing
Use the `experimental_AstroContainer` to render components in isolation within Vitest.

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Card from '../src/components/Card.astro';

const container = await AstroContainer.create();
const html = await container.renderToString(Card, { props: { title: 'Hello' } });
expect(html).toContain('Hello');
```

### E2E Testing
Run Playwright against the production build using `astro preview`.

```ts
// playwright.config.ts
export default defineConfig({
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Prefetching

Enable speculative loading to improve perceived performance.

- **Global**: `prefetch: true` in config.
- **Declarative**: `data-astro-prefetch="viewport"` on specific anchors.
- **Programmatic**: `import { prefetch } from 'astro:prefetch'`.

## CLI Quick Reference
- `astro sync`: Generate types for content collections and env.
- `astro check`: Perform type checking and linting.
- `astro build`: Generate production assets.
- `astro preview`: Locally serve the production build.

<!--
Source references:
- https://docs.astro.build/en/guides/deploy/
- https://docs.astro.build/en/guides/internationalization/
- https://docs.astro.build/en/guides/testing/
- https://docs.astro.build/en/guides/prefetch/
- https://docs.astro.build/en/reference/cli-reference/
-->
