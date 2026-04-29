---
name: features-content-collections
description: Manage and query content collections with loaders and Zod schemas.
---

# Content Collections

Content collections provide a type-safe way to manage Markdown, MDX, JSON, or YAML files, as well as remote data via loaders.

## Configuration

Define collections in `src/content.config.ts`.

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const blog = defineCollection({
  // glob for local files, file for single JSON/YAML
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.date(),
    draft: z.boolean().default(false),
    cover: image().optional(), // image helper for asset optimization
    author: z.string().default('Anonymous'),
    tags: z.array(z.string()).default([]),
    related: z.array(reference('blog')).optional(), // cross-collection relation
  }),
});

export const collections = { blog };
```

## Querying and Rendering

Use `getCollection` or `getEntry` to retrieve data, and `render` to process content.

```astro
---
import { getCollection, getEntry, render } from 'astro:content';

// Query with optional filter
const posts = await getCollection('blog', ({ data }) => !data.draft);

// Get specific entry by ID
const entry = await getEntry('blog', 'my-post-id');

if (!entry) return Astro.redirect('/404');

// Render Content component and metadata
const { Content, headings } = await render(entry);
---
<h1>{entry.data.title}</h1>
<Content />
```

## Advanced Loaders

Loaders can fetch data from any source (APIs, databases).

- `glob({ pattern, base })`: Matches files in a directory.
- `file(fileName)`: Loads a single file containing an array of objects.
- `LiveLoader<TData>`: Used for real-time updates without full rebuilds.
- `loadCollection()`, `loadEntry()`: programmatic access to live data.

### Custom Loader Context

Custom loaders use a context object to manage the store:
- `store`: The data store for collection entries.
- `meta`: Persistent metadata across loads.
- `parseData()`: Validates raw data against the schema.
- `generateDigest()`: Creates a content hash for change detection.

## Constraints

- Live collections do not support MDX or automatic image optimization.
- Custom IDs can be defined via a `slug` field in data or the `generateId` loader option.

<!--
Source references:
- https://docs.astro.build/en/guides/content-collections/
- https://docs.astro.build/en/reference/content-loader-reference/
-->
