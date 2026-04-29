---
name: features-integrations
description: Extend Astro with framework support, CSS tools, and custom build hooks.
---

# Integrations and Frameworks

Integrations allow Astro to support UI frameworks (React, Vue, Svelte, Solid), CSS tools (Tailwind), and custom build logic.

## Using Frameworks

Framework components are imported and used directly in `.astro` files.

```astro
---
import ReactButton from '../components/ReactButton';
import SvelteForm from '../components/SvelteForm.svelte';
---
<!-- Pass props and children from Astro -->
<ReactButton client:load>
  <SvelteForm client:visible slot="children" />
</ReactButton>
```

### Constraints

- You cannot import `.astro` components inside framework components (React/Vue/etc.).
- Only JSON-serializable props can be passed to hydrated components.
- Functions passed as props must be defined in a separate file and imported, or passed via a slot.

## Authoring Integrations

Integrations use lifecycle hooks to modify the build process or dev server.

```ts
// my-integration.ts
import type { AstroIntegration } from 'astro';

export default function myIntegration(): AstroIntegration {
  return {
    name: 'my-custom-integration',
    hooks: {
      'astro:config:setup': ({ updateConfig, addMiddleware, injectRoute, injectScript }) => {
        // Modify Vite config
        updateConfig({
          vite: { plugins: [/* ... */] }
        });
        
        // Inject a route programmatically
        injectRoute({
          pattern: '/internal-dashboard',
          entrypoint: './src/pages/dashboard.astro'
        });

        // Add middleware
        addMiddleware({
          entrypoint: './src/middleware.ts',
          order: 'pre'
        });

        // Inject client-side script
        injectScript('page', 'import "my-analytics-lib";');
      },
      'astro:build:done': ({ pages, dir }) => {
        console.log(`Built ${pages.length} pages to ${dir}`);
      }
    }
  };
}
```

## Key Hooks Summary

- `astro:config:setup`: Primary hook for configuration and resource injection.
- `astro:config:done`: Called after config is finalized; useful for adapters.
- `astro:server:setup`: Configure the Vite dev server (add middleware, etc.).
- `astro:build:done`: Post-processing after a successful production build.
- `astro:route:setup`: Access and modify individual route configurations.

<!--
Source references:
- https://docs.astro.build/en/guides/integrations/
- https://docs.astro.build/en/guides/framework-components/
- https://docs.astro.build/en/reference/integrations-reference/
-->
