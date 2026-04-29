---
name: features-view-transitions
description: Implement seamless page transitions and state persistence using the Client Router.
---

# View Transitions

Astro enables seamless navigation and persistent UI state across page loads using the `ClientRouter`.

## Enablement

Add the `<ClientRouter />` component to the `<head>` of your common layout.

```astro
---
import { ClientRouter } from 'astro:transitions';
---
<html>
<head>
  <ClientRouter />
</head>
<body>
  <slot />
</body>
</html>
```

## Transition Directives

- `transition:name="id"`: Associates two elements on different pages for a shared element transition.
- `transition:animate="slide|fade|none|initial"`: Defines the animation type for the page or specific element.
- `transition:persist`: Keeps an element and its state (e.g., `<video>` playback, React component state) alive across navigations.

```astro
<!-- Morph image from gallery to detail page -->
<img transition:name={`hero-${post.id}`} src={post.image} />

<!-- Persist interactive state -->
<AudioPlayer client:load transition:persist />
```

## Navigation Control

- `data-astro-reload`: Attribute on links to force a full page reload.
- `data-astro-history="replace"`: Replaces the current history entry instead of pushing a new one.

```ts
// Programmatic navigation
import { navigate } from 'astro:transitions/client';

navigate('/new-path', { history: 'replace' });
```

## Lifecycle Events

Use events to run logic during the navigation lifecycle.

```js
document.addEventListener('astro:page-load', () => {
  // Executes on initial load and after every ClientRouter navigation
  initTooltips();
});

document.addEventListener('astro:before-swap', (ev) => {
  // Access ev.newDocument to modify the incoming HTML before it is swapped
  const theme = localStorage.getItem('theme');
  ev.newDocument.documentElement.dataset.theme = theme;
});
```

### Script Execution

- **Module scripts**: Run once per full page load.
- **Inline scripts**: Re-run on every navigation unless opted out.
- `data-astro-rerun`: Attribute to force a script to re-run on every page navigation.

<!--
Source references:
- https://docs.astro.build/en/guides/view-transitions/
-->
