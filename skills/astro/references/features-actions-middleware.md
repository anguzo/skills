---
name: features-actions-middleware
description: Handle server-side logic with type-safe actions, middleware, and endpoints.
---

# Actions, Middleware, and Endpoints

Astro provides primitives for handling server-side logic, data mutations, and request lifecycle management.

## Actions

Actions are type-safe server functions defined in `src/actions/index.ts`.

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  subscribe: defineAction({
    accept: 'form', // Handles FormData automatically
    input: z.object({ email: z.string().email() }),
    handler: async (input, context) => {
      // Access context.cookies, context.session, context.locals
      return { success: true };
    },
  }),
};
```

### Usage

```astro
---
import { actions } from 'astro:actions';
// Get result from a form submission
const result = Astro.getActionResult(actions.subscribe);
---
<form method="POST" action={actions.subscribe}>
  <input name="email" type="email" />
  <button>Subscribe</button>
</form>
{result?.data?.success && <p>Subscribed!</p>}
```

## Middleware

Middleware runs for every request. Define it in `src/middleware.ts`.

```ts
// src/middleware.ts
import { defineMiddleware, sequence } from 'astro:middleware';

const auth = defineMiddleware(async (context, next) => {
  const token = context.cookies.get('session')?.value;
  context.locals.user = token ? await verify(token) : null;
  return next(); // Continue to next middleware or page
});

const protector = defineMiddleware(async (context, next) => {
  if (context.url.pathname.startsWith('/admin') && !context.locals.user) {
    return context.redirect('/login');
  }
  return next();
});

export const onRequest = sequence(auth, protector);
```

## API Endpoints

Create `.ts` files in `src/pages/` to handle HTTP methods.

```ts
// src/pages/api/v1/user.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  return new Response(JSON.stringify({ user: locals.user }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  return new Response(null, { status: 201 });
};
```

## Sessions

Requires a session driver configured in `astro.config.mjs`.

```ts
// Inside an Action or Page
const cart = Astro.session.get('cart');
Astro.session.set('cart', [...cart, item]);
Astro.session.regenerate(); // Prevent session fixation
Astro.session.destroy();
```

Types are defined via `App.SessionData` and `App.Locals` in `src/env.d.ts`.

<!--
Source references:
- https://docs.astro.build/en/guides/actions/
- https://docs.astro.build/en/guides/middleware/
- https://docs.astro.build/en/guides/endpoints/
- https://docs.astro.build/en/guides/sessions/
-->
