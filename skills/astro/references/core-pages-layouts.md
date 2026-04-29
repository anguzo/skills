---
name: core-pages-layouts
description: Page types, layout patterns, and project structure.
---

# Pages and Layouts

Pages are responsible for handling routing, data fetching, and the overall structure of a page. Layouts are reusable components used to wrap pages with common UI (e.g., headers, footers).

## Page Types

Files in `src/pages/` can be:
- `.astro`: Full-featured components with frontmatter.
- `.md`, `.mdx`: Content-driven pages.
- `.html`: Static HTML files.
- `.js`, `.ts`: API endpoints (serving JSON, images, etc.).

## Page Structure and Partials

Astro pages typically contain a full `<html>` document. However, you can export `partial = true` to render only the component's HTML without a full document wrapper, useful for HTMX or AJAX updates.

```astro
---
export const partial = true;
---
<li>New item content</li>
```

### Error Pages

- `src/pages/404.astro`: Custom 404 page.
- `src/pages/500.astro`: Custom error page for SSR. Receives the `error` prop.

```astro
---
// 500.astro
interface Props {
  error: unknown;
}
const { error } = Astro.props;
---
<h1>Something went wrong</h1>
<pre>{error instanceof Error ? error.message : 'Unknown error'}</pre>
```

## Layout Patterns

Layouts are standard Astro components that use `<slot />` to inject page content.

```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{title}</title>
  </head>
  <body>
    <header>My Site</header>
    <slot />
  </body>
</html>
```

## Markdown Layouts

Markdown files can specify a layout in their frontmatter. The layout component receives markdown-specific props like `frontmatter`, `headings`, and `rawContent()`.

```astro
---
// src/layouts/MarkdownLayout.astro
const { frontmatter, headings } = Astro.props;
---
<html>
  <body>
    <h1>{frontmatter.title}</h1>
    <nav>
      {headings.map(h => <a href={`#${h.slug}`}>{h.text}</a>)}
    </nav>
    <slot />
  </body>
</html>
```

## Project Structure

Astro follows a specific directory convention for organization:

- `src/pages/`: **Required.** Routing entry points.
- `src/content/`: **Required for Content Collections.** Data-driven content.
- `src/components/`: Reusable UI components.
- `src/layouts/`: Reusable page wrappers.
- `src/styles/`: Global or shared CSS.
- `public/`: Static assets (images, robots.txt) copied to root as-is.

<!--
Source references:
- https://docs.astro.build/en/basics/astro-pages/
- https://docs.astro.build/en/basics/layouts/
- https://docs.astro.build/en/basics/project-structure/
-->
