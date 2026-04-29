---
name: best-practices-styling
description: Scoped styles, CSS frameworks, font optimization, and image handling in Astro.
---

# Styling Best Practices

Astro components use scoped CSS by default, ensuring styles don't leak out of the component.

## Scoping and Directives

Styles in `.astro` files are scoped via unique attributes. Use directives to control bundling and visibility.

- `:global()`: Scopes a single selector globally.
- `is:global`: Makes the entire `<style>` block global.
- `is:inline`: Prevents Astro from bundling or processing the style block.
- `define:vars`: Passes JavaScript variables to CSS as custom properties.

```astro
---
const color = "red";
---
<style define:vars={{ color }}>
  .text { color: var(--color); }
  :global(body) { margin: 0; }
</style>

<div class="text">Scoped red text</div>
```

## CSS Frameworks and Modules

### Tailwind CSS
Tailwind 4 uses `@tailwindcss/vite`. Add it to your Vite plugins and import in your CSS.

```css
/* src/styles/global.css */
@import "tailwindcss";
```

### CSS Modules
Files ending in `.module.css` are treated as CSS modules. Import them as objects in your frontmatter.

```astro
---
import styles from '../styles/utils.module.css';
---
<div class={styles.container}>...</div>
```

## Fonts API

Configure fonts in `astro.config.mjs` to automate preloading and CSS variable generation. Supported providers include `google`, `fontsource`, `local`, `adobe`, and `bunny`.

```js
export default defineConfig({
  fonts: [{
    name: 'Inter',
    provider: 'google',
    cssVariable: '--font-inter',
    weights: [400, 700],
  }],
});
```

Apply the font using the generated variable:
```css
body { font-family: var(--font-inter), sans-serif; }
```

## Image Handling in CSS

- **src/ images**: Use relative paths in `url()`. Astro processes and hashes these files.
- **public/ images**: Use absolute paths (e.g., `/images/logo.png`). These are served verbatim.

## Constraints
- Scoped styles do not bleed into children or slotted content.
- `class:list` is the preferred way to handle conditional classes.
- Avoid `is:inline` unless you need to prevent the style from being bundled with the rest of the site's CSS.

<!--
Source references:
- https://docs.astro.build/en/guides/styling/
- https://docs.astro.build/en/guides/fonts/
- https://docs.astro.build/en/reference/directives-reference/
-->
