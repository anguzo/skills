---
name: astro
description: Full-stack web framework for content-driven sites with islands architecture. Use when building Astro projects, configuring rendering modes (static/SSR/hybrid), working with content collections, server islands, view transitions, actions, middleware, or deploying with adapters. Covers component syntax, routing, integrations, and the Astro API.
metadata:
  author: anguzo
  version: "2026.4.29"
  source: Generated from https://github.com/withastro/docs, scripts located at https://github.com/anguzo/skills
---

Astro is a web framework that renders HTML on the server and only hydrates interactive components ("islands"). It ships zero JavaScript by default, supports multiple UI frameworks (React, Vue, Svelte, Solid, Preact) on the same page, and provides built-in content collections, view transitions, server actions, and image optimization.

**Important:** Astro defaults to static output. For server-side rendering, set `output: 'server'` and install an adapter. Components are `.astro` files with a frontmatter script fence (`---`) and an HTML template. Use `client:*` directives to hydrate framework components and `server:defer` for server islands.

> The skill is based on Astro v6, generated at 2026-04-29.

## Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| Components | Astro component syntax, props, slots, expressions, template directives | [core-components](references/core-components.md) |
| Routing | File-based routing, dynamic params, getStaticPaths, redirects, rewrites | [core-routing](references/core-routing.md) |
| Pages & Layouts | Page types, layouts, project structure, error pages, partials | [core-pages-layouts](references/core-pages-layouts.md) |
| Configuration | astro.config.mjs options: output, build, server, image, i18n, env, fonts | [core-config](references/core-config.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|-----------|
| Content Collections | Defining collections, loaders (glob/file/custom/live), schemas, querying, rendering | [features-content-collections](references/features-content-collections.md) |
| Rendering Modes | Static/SSR/hybrid output, adapters, prerender, islands, server islands | [features-rendering](references/features-rendering.md) |
| Actions & Middleware | Server actions, form handling, middleware, endpoints, sessions | [features-actions-middleware](references/features-actions-middleware.md) |
| View Transitions | ClientRouter, transition directives, persistence, lifecycle events | [features-view-transitions](references/features-view-transitions.md) |
| Integrations | Integration hooks API, framework components, adding/authoring integrations | [features-integrations](references/features-integrations.md) |
| Data & Images | Data fetching, API endpoints, Astro DB, Image/Picture optimization | [features-data-images](references/features-data-images.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|-----------|
| TypeScript | tsconfig setup, type utilities, env vars, astro:env schema validation | [best-practices-typescript](references/best-practices-typescript.md) |
| Styling | Scoped CSS, Tailwind, fonts API, preprocessors, CSS Modules | [best-practices-styling](references/best-practices-styling.md) |
| Deployment | Adapter selection, deployment patterns, i18n routing, testing strategies | [best-practices-deployment](references/best-practices-deployment.md) |
