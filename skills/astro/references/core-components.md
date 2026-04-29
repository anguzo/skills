---
name: core-components
description: Astro component structure, props, slots, and template syntax.
---

# Astro Components

Astro components (.astro files) are the basic building blocks of any Astro project. They consist of a component script (frontmatter) and a component template. They render to HTML at build time (or on-demand in SSR) and have no client-side runtime by default.

## Structure

The component script is defined by the code fence `---`. This is where you import other components, define variables, and access props. The component template is everything below the code fence.

```astro
---
// Component Script (Frontmatter)
import MyOtherComponent from './MyOtherComponent.astro';

interface Props {
  title: string;
  items?: string[];
}

const { title, items = [] } = Astro.props;
---
<!-- Component Template -->
<div>
  <h1>{title}</h1>
  <ul>
    {items.map(item => <li>{item}</li>)}
  </ul>
  <MyOtherComponent />
</div>
```

## Props and Slots

Props are passed via attributes and accessed via `Astro.props`. Use `interface Props` for TypeScript support. Slots allow passing HTML or other components into a component.

```astro
---
// Layout.astro
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<main>
  <h1>{title}</h1>
  <!-- Default slot -->
  <slot /> 
  <!-- Named slot with fallback -->
  <footer>
    <slot name="footer">
      <p>Default footer content</p>
    </slot>
  </footer>
</main>
```

```astro
---
// Usage
import Layout from './Layout.astro';
---
<Layout title="Home Page">
  <p>Main content for the default slot.</p>
  <div slot="footer">Custom footer content</div>
</Layout>
```

### Slot Logic

Access slot metadata using `Astro.slots`.

- `Astro.slots.has(name)`: Returns true if a slot has content.
- `Astro.slots.render(name, args?)`: Renders the slot content to a string.

## Template Directives and Logic

Astro uses JSX-like expressions but with specific directives for HTML attributes and content.

- `{expression}`: Dynamic values and logic (map, ternary, etc.).
- `<Fragment>` or `<>`: Group multiple elements without adding to the DOM.
- `class:list`: Dynamically manage CSS classes using strings, objects, or arrays.
- `set:html`: Inject raw HTML string (unsafe, similar to innerHTML).
- `set:text`: Inject text content.
- `Astro.self`: Allows a component to call itself recursively.

```astro
---
const isActive = true;
const rawHtml = '<strong>bold</strong>';
---
<div class:list={['base', { active: isActive }]} />
<div set:html={rawHtml} />
<div set:text={'Plain text'} />
```

## Key Rules

- **No Client Runtime**: Components render to static HTML unless a UI framework integration (React, Vue, etc.) is used with a client directive.
- **Multiple Roots**: Components can have multiple top-level elements.
- **HTML Comments**: Standard `<!-- comments -->` are preserved in the rendered HTML.
- **Kebab-case Attributes**: Use standard HTML attribute names (e.g., `class`, `onmouseover`) instead of camelCase.
- **.html Files**: Can be used as components but cannot contain frontmatter or dynamic expressions.

<!--
Source references:
- https://docs.astro.build/en/basics/astro-components/
- https://docs.astro.build/en/reference/astro-syntax/
- https://docs.astro.build/en/reference/directives-reference/
-->
