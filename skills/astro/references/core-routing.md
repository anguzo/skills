---
name: core-routing
description: File-based routing, dynamic parameters, and path generation.
---

# Routing

Astro uses file-based routing based on the structure of the `src/pages/` directory. Each file in this directory maps to a URL path on your site.

## Static and Dynamic Routes

Standard files map directly to paths. Dynamic routes use brackets to define parameters.

- `src/pages/index.astro` -> `/`
- `src/pages/about.astro` -> `/about`
- `src/pages/posts/[slug].astro` -> `/posts/my-post` (`Astro.params.slug`)
- `src/pages/docs/[...slug].astro` -> `/docs/any/deep/path` (Rest parameters)

## Static Path Generation

In static mode (default), dynamic routes must export `getStaticPaths()` to specify which paths will be generated at build time. This function returns an array of objects containing `params` and optional `props`.

```astro
---
// src/pages/posts/[slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.id },
    props: { post }
  }));
}

const { post } = Astro.props;
---
<h1>{post.data.title}</h1>
```

## Pagination

Use the `paginate()` helper within `getStaticPaths()` to create paginated routes.

```astro
---
// src/pages/blog/[...page].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths({ paginate }) {
  const posts = await getCollection('blog');
  return paginate(posts, { pageSize: 10 });
}

const { page } = Astro.props;
---
{page.data.map(post => <h2>{post.data.title}</h2>)}
<a href={page.url.prev}>Previous</a>
<a href={page.url.next}>Next</a>
```

## Server-Side Rendering (SSR)

When `output: 'server'` or `'hybrid'` is configured, `getStaticPaths` is not used. Parameters are accessed directly from `Astro.params`.

```astro
---
// SSR Route
const { id } = Astro.params;
const data = await fetch(`https://api.example.com/item/${id}`).then(r => r.json());
---
```

## Navigation Control

- `Astro.redirect(path, status)`: Redirects to another page. Must be returned from the frontmatter.
- `Astro.rewrite(path)`: Re-renders the page using content from another path without changing the URL.

```astro
---
if (!Astro.props.allowed) {
  return Astro.redirect('/login', 302);
}
---
```

## Route Configuration

- **Priority**: Static routes take precedence over dynamic routes, which take precedence over rest parameters.
- **Redirects**: Configure in `astro.config.mjs`.
- **trailingSlash**: Configures whether paths require or forbid trailing slashes.
- **Named Extensions**: Files like `src/pages/feed.xml.ts` will generate `/feed.xml`.

<!--
Source references:
- https://docs.astro.build/en/guides/routing/
- https://docs.astro.build/en/reference/routing-reference/
-->
