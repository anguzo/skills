# My Skills Collection

This repository is my personal collection of agent skills, based on [Anthony Fu's approach](https://github.com/antfu/skills) for organizing and maintaining skills repositories, while removing the bundled opinions, vendor content, and source material that were specific to that implementation.

The goal of this repo is to stay useful as both a working collection and a maintainable source repo for future skill generation and syncing.

## Approach

This setup keeps the core generation logic centered on:

- `AGENTS.md` for the repository rules and generation guidance
- `meta.ts` for the list of source repos, vendors, and manual skills
- `scripts/cli.ts` for the repository management commands

The workflow still revolves around the same three skill sources:

1. **Generated skills** from documentation-first source repositories
2. **Synced skills** copied from upstream repositories that already maintain their own skills
3. **Manual skills** that I maintain directly in this repo

The content folders are intentionally empty right now, but the structure remains so the repo can grow without needing to be reorganized later.

## Repository Structure

```text
.
├── AGENTS.md
├── meta.ts
├── scripts/
│   └── cli.ts
├── instructions/
├── sources/
├── vendor/
└── skills/
```

## Customize

Update `meta.ts` with the projects and skills you want to manage.

- Add source repositories to `submodules`
- Add upstream skill providers to `vendors`
- Add directly maintained skills to `manual`

Once those lists are populated, the CLI commands can be used to initialize, check, sync, and clean the repository layout.

## Scripts

```bash
pnpm start # runs the repository CLI
```

## License

This repository is [MIT](LICENSE.md) licensed.
