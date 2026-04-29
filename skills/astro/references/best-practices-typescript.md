---
name: best-practices-typescript
description: TypeScript configuration, component typing, environment variables, and global type extensions in Astro.
---

# TypeScript Best Practices

Astro provides first-class TypeScript support. While the Astro compiler does not perform type checking during build, it provides tools for robust development-time validation.

## Environment Setup

Configure `tsconfig.json` to leverage Astro's built-in strict configurations and ensure type definitions are correctly synchronized.

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

Run `astro sync` to generate content collection and environment variable types. Use `astro check` for project-wide type checking, as `astro build` only transpiles.

## Component Typing

Define props in the frontmatter using the `Props` interface. Use `HTMLAttributes` to extend standard HTML elements or `Polymorphic` for the `as` prop pattern.

```astro
---
import type { HTMLAttributes } from 'astro/types';

interface Props extends HTMLAttributes<'button'> {
  variant: 'primary' | 'secondary';
}

const { variant, ...attrs } = Astro.props;
---
<button class:list={[variant]} {...attrs}>
  <slot />
</button>
```

### Type Utilities
- `ComponentProps<typeof MyComponent>`: Extract props from a component.
- `InferGetStaticParamsType<typeof getStaticPaths>`: Type for static path parameters.
- `InferGetStaticPropsType<typeof getStaticPaths>`: Type for static path props.

## Environment Variables

Astro supports standard `import.meta.env` and the type-safe `astro:env` module.

### Typed Environment (astro:env)
Define a schema in `astro.config.mjs` to enable runtime validation and generated types.

```js
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  env: {
    schema: {
      API_KEY: envField.string({ context: 'server', access: 'secret' }),
      PUBLIC_URL: envField.string({ context: 'client', access: 'public' }),
      PORT: envField.number({ context: 'server', access: 'public', default: 3000 }),
    }
  }
});
```

Import validated variables from the appropriate virtual module:
- `import { API_KEY } from 'astro:env/server'`
- `import { PUBLIC_URL } from 'astro:env/client'`

## Global Type Extensions

Extend `App` namespace in `src/env.d.ts` to type middleware locals or session data.

```ts
declare namespace App {
  interface Locals {
    user: { id: string; role: 'admin' | 'user' } | null;
  }
  interface SessionData {
    cartId: string;
  }
}
```

<!--
Source references:
- https://docs.astro.build/en/guides/typescript/
- https://docs.astro.build/en/guides/environment-variables/
-->
