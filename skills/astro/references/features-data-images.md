---
name: features-data-images
description: Manage data fetching, SQL databases with Astro DB, and image optimization.
---

# Data, DB, and Assets

Astro provides built-in tools for fetching data, managing a type-safe SQL database, and optimizing images.

## Data Fetching

Use top-level `await` in component frontmatter.

```astro
---
// Runs at build-time (static) or request-time (SSR)
const response = await fetch('https://api.example.com/data');
const data = await response.json();
---
<ul>
  {data.map(item => <li>{item.name}</li>)}
</ul>
```

## Astro DB

Astro DB is a fully managed SQL database based on Drizzle ORM.

### Configuration

Define your tables in `db/config.ts`.

```ts
// db/config.ts
import { defineDb, defineTable, column } from 'astro:db';

const Post = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    title: column.text(),
    published: column.date(),
    authorId: column.number({ references: () => Author.columns.id }),
  },
});

const Author = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
  },
});

export default defineDb({ tables: { Post, Author } });
```

### Querying

```astro
---
import { db, Post, Author, eq } from 'astro:db';

const posts = await db.select({
  title: Post.title,
  author: Author.name,
})
.from(Post)
.innerJoin(Author, eq(Post.authorId, Author.id))
.where(eq(Post.published, true));
---
```

## Image Optimization

The `astro:assets` module handles local and remote image processing.

```astro
---
import { Image, Picture } from 'astro:assets';
import localImage from '../assets/hero.png';
---
<!-- Optimized local image -->
<Image src={localImage} alt="Descriptive text" width={800} />

<!-- Responsive picture with multiple formats -->
<Picture 
  src={localImage} 
  formats={['avif', 'webp']} 
  widths={[400, 800, 1200]}
  sizes="(max-width: 800px) 100vw, 800px"
  alt="Hero background" 
/>
```

### Programmatic Images

Use `getImage()` for background images or server-side logic (cannot be used on the client).

```ts
import { getImage } from 'astro:assets';
const optimized = await getImage({ src: localImage, format: 'webp' });
console.log(optimized.src);
```

### Remote Images

Authorization is required in `astro.config.mjs`:
```js
image: {
  remotePatterns: [{ protocol: 'https', hostname: 'example.com' }],
}
```

<!--
Source references:
- https://docs.astro.build/en/guides/data-fetching/
- https://docs.astro.build/en/guides/images/
- https://docs.astro.build/en/guides/astro-db/
-->
