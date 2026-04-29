---
name: terragrunt-filter
description: Terragrunt --filter flag — path, name, attribute, graph, git expressions, combining and negating filters
---

# Terragrunt Filtering

The `--filter` flag provides a query language for targeting specific units and stacks. Use with `find`, `list`, `run`, `hcl fmt`, `hcl validate`, `stack run`, `stack generate`.

## Filter Types

### Path Expressions

Match by filesystem path using glob patterns:

```bash
terragrunt find --filter './prod/**'              # All units under prod/
terragrunt find --filter './prod/services/web'    # Exact path
terragrunt find --filter './**/vpc'               # Any vpc unit at any depth
```

### Name Expressions

Match by unit/stack directory name:

```bash
terragrunt find --filter 'name=web'               # Unit named "web"
terragrunt find --filter 'vpc'                    # Shorthand for name=vpc
```

### Attribute Expressions

Match by configuration attributes:

```bash
terragrunt find --filter 'type=unit'              # Only units (not stacks)
terragrunt find --filter 'type=stack'             # Only stacks
terragrunt find --filter 'reading=shared.hcl'     # Units that read shared.hcl
```

### Graph Expressions

Filter based on dependency relationships:

```bash
# All ancestors (dependencies) of vpc
terragrunt find --filter '...vpc'

# All descendants (dependents) of vpc
terragrunt find --filter 'vpc...'

# Include vpc itself + all ancestors
terragrunt find --filter '...vpc | name=vpc'
```

### Git Expressions

Filter based on Git diffs:

```bash
# Units with changes since main branch
terragrunt find --filter 'git(main)'

# Units changed in last commit
terragrunt find --filter 'git(HEAD~1)'

# Units changed between two refs
terragrunt find --filter 'git(v1.0.0..HEAD)'
```

## Combining Filters

### Intersection (| operator)

Narrow results — both conditions must match:

```bash
# Units in prod/ AND named "web"
terragrunt find --filter './prod/** | name=web'
```

### Union (multiple --filter flags)

Combine results — either condition matches:

```bash
# Units in prod/ OR units named "vpc"
terragrunt find --filter './prod/**' --filter 'name=vpc'
```

### Negation (! prefix)

Exclude matching units:

```bash
# Everything EXCEPT units under test/
terragrunt find --filter '!./test/**'

# All prod units except databases
terragrunt find --filter './prod/**' --filter '!./prod/**/database'
```

## Queue Behavior with Filters

- **No positive filters:** Include all units (default behavior).
- **Any positive filter present:** Switch to "exclude by default" — only include units matching a positive filter.
- **Negative filters:** Always evaluated after positive filters.

```bash
# Only run prod units (positive filter activates exclude-by-default)
terragrunt run --all --filter './prod/**' -- plan

# Run all units EXCEPT test (negative filter with default include-all)
terragrunt run --all --filter '!./test/**' -- plan

# Combine: only prod, but not databases
terragrunt run --all --filter './prod/**' --filter '!./**/database' -- plan
```

## Comparison with Legacy Queue Flags

| Legacy Flag | Filter Equivalent |
|-------------|-------------------|
| `--queue-include-dir=./path` | `--filter='./path'` |
| `--queue-exclude-dir=./path` | `--filter='!./path'` |
| `--queue-include-external` | `--filter='{./**}...'` |
| `--queue-include-units-reading=shared.hcl` | `--filter='reading=shared.hcl'` |

Legacy flags are internally aliased to filter expressions.

## Filters File

Store frequently-used filters in a file:

```bash
terragrunt run --all --filters-file=.terragrunt-filters -- plan
```

Disable: `--no-filters-file`

## Dry-Run Workflow

Test filter targeting before modifying infrastructure:

```bash
# 1. See what would be targeted
terragrunt find --filter './prod/** | name=web'

# 2. See ordered list with metadata
terragrunt list --filter './prod/** | name=web' --long --as apply

# 3. Execute with confidence
terragrunt run --all --filter './prod/** | name=web' -- apply
```

<!--
Source references:
- sources/terragrunt/docs/src/content/docs/03-features/08-filter/index.mdx
- sources/terragrunt/docs/src/content/docs/03-features/08-filter/02-name.mdx
- sources/terragrunt/docs/src/content/docs/03-features/08-filter/03-path.mdx
- sources/terragrunt/docs/src/content/docs/03-features/08-filter/04-attributes.mdx
- sources/terragrunt/docs/src/content/docs/03-features/08-filter/05-graph.mdx
- sources/terragrunt/docs/src/content/docs/03-features/08-filter/06-git.mdx
- sources/terragrunt/docs/src/content/docs/03-features/08-filter/07-combining.mdx
-->
