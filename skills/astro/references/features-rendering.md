---
name: features-rendering
description: Control output modes, islands architecture, and server-side rendering patterns.
---

# Rendering Modes and Islands

Astro supports multiple output modes and partial hydration (islands) to balance performance and interactivity.

## Output Modes

Configured in `astro.config.mjs`.

- `static` (default): All pages are prerendered at build time.
- `server`: All pages are rendered on-demand (SSR). Requires an adapter.

### Per-Route Control

Override the global output mode on specific pages or endpoints.

```astro
---
// Opt-out of SSR in 'server' mode or opt-in to prerender in 'static' mode
export const prerender = true;
---
```

## Islands Architecture

Islands are interactive UI components (React, Vue, Svelte, etc.) embedded in static HTML.

```astro
<!-- Static by default: No JS sent to browser -->
<Header />

<!-- Client Directives for Hydration -->
<SearchWidget client:load />           <!-- Immediate hydration -->
<Newsletter client:idle />             <!-- When main thread is free -->
<Comments client:visible />            <!-- When element enters viewport -->
<Sidebar client:media="(min-width: 768px)" /> <!-- On specific screen size -->
<Modal client:only="react" />          <!-- Skip SSR, render only on client -->
```

## Server Islands

Server islands allow deferring the rendering of dynamic Astro components until after the initial page shell is sent.

```astro
<!-- Rendered after page load via a background request -->
<UserAvatar server:defer>
  <div slot="fallback" class="skeleton-loader" />
</UserAvatar>
```

### Constraints and Security

- **Serializable Props**: Only JSON-serializable data can be passed to server islands.
- **Context**: `Astro.url` inside a server island refers to the island's endpoint, not the parent page URL.
- **Encryption**: Set `ASTRO_KEY` environment variable to sign island requests.

## SSR Control

In `server` mode, use the `Astro` global to control the response.

```astro
---
Astro.response.status = 404;
Astro.response.headers.set('Cache-Control', 'public, max-age=3600');
---
```

Astro automatically streams HTML to the browser as it's generated in SSR mode.

<!--
Source references:
- https://docs.astro.build/en/guides/on-demand-rendering/
- https://docs.astro.build/en/concepts/islands/
- https://docs.astro.build/en/guides/server-islands/
-->
