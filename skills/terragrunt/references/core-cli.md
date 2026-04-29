---
name: terragrunt-cli
description: Terragrunt CLI commands — run, exec, find, list, scaffold, catalog, render, backend, stack, hcl fmt/validate, graph
---

# Terragrunt CLI Commands

The `terragrunt` binary wraps OpenTofu/Terraform. Most of the time, replace `tofu`/`terraform` with `terragrunt` and it just works (auto-init, auto-retry, logging).

## OpenTofu/Terraform Shortcuts

Common commands forwarded directly to OpenTofu/Terraform with Terragrunt enhancements:

```bash
terragrunt plan          # → tofu plan (with auto-init, inputs as TF_VAR_*)
terragrunt apply         # → tofu apply
terragrunt destroy       # → tofu destroy
terragrunt output        # → tofu output
terragrunt validate      # → tofu validate
terragrunt init          # → tofu init
terragrunt providers     # → tofu providers
terragrunt state         # → tofu state
```

For any command not in the shortcut list, use `run`:
```bash
terragrunt run -- workspace list
terragrunt run -- force-unlock LOCK_ID
```

## run

The primary command for executing OpenTofu/Terraform operations.

```bash
# Run in current unit
terragrunt run -- plan

# Run across all units in current stack
terragrunt run --all -- apply

# Run only on dependency graph connected to current unit
terragrunt run --graph -- plan
```

### Key flags

| Flag | Description |
|------|-------------|
| `--all` | Run command across all units in current working directory |
| `--graph` | Run only units connected to current unit's dependency graph |
| `--parallelism N` | Max concurrent unit executions (default: varies) |
| `--queue-ignore-dag-order` | Run all units concurrently ignoring DAG (safe for `plan`/`validate`) |
| `--queue-ignore-errors` | Continue even if some units fail |
| `--fail-fast` | Stop all remaining units on first failure |
| `--no-auto-approve` | Override default auto-approve in `--all` mode |
| `--filter EXPR` | Target specific units (see filter feature) |
| `--feature NAME=VALUE` | Set feature flag value |
| `--source PATH` | Override terraform.source for local dev |
| `--source-update` | Force re-download of remote source |
| `--tf-path PATH` | Override path to tofu/terraform binary |

### Important behaviors

- `run --all apply/destroy` adds `-auto-approve` automatically (shared stdin limitation).
- DAG order: apply/plan = dependencies first; destroy = dependents first.
- Provider cache server starts automatically with `run --all` to avoid concurrent plugin downloads.

## exec

Run arbitrary shell commands across units in the stack.

```bash
terragrunt exec --all -- echo "Hello from $(pwd)"
```

## find

Discover units and stacks in the current directory tree. Returns paths.

```bash
terragrunt find
terragrunt find --filter './prod/**'
terragrunt find --filter 'type=stack'
```

## list

Discover units and stacks with additional metadata (type, path, dependencies).

```bash
terragrunt list
terragrunt list --long               # Show type column
terragrunt list --tree               # Tree view
terragrunt list --dependencies       # Show dependency info
terragrunt list --as destroy         # Order as if running destroy
terragrunt list --format json        # JSON output
```

## scaffold

Generate a new unit from a module source.

```bash
terragrunt scaffold git::git@github.com:acme/modules.git//vpc?ref=v1.0.0
terragrunt scaffold --var "region=us-east-1" --var "env=prod"
```

Creates `terragrunt.hcl` with proper `source`, generates variable placeholders from module inputs.

### Flags

- `--var KEY=VALUE`: Pre-populate input values.
- `--var-file PATH`: Load variables from file.
- `--no-include-root`: Skip adding include block for root.hcl.

## catalog

Browse available modules in configured catalogs (TUI or web interface).

```bash
terragrunt catalog             # Launch TUI
terragrunt catalog --url URL   # Specify catalog URL
```

## render

Show the fully-resolved Terragrunt configuration (after includes, merges, interpolations).

```bash
terragrunt render              # Render current unit
terragrunt render --all        # Render all units
terragrunt render --format json
terragrunt render --write      # Write to file
```

## backend Commands

Manage state backend resources.

```bash
terragrunt backend bootstrap    # Create state backend resources (S3 bucket, DynamoDB table)
terragrunt backend migrate      # Migrate state between backends
terragrunt backend delete       # Delete backend resources
```

`backend bootstrap` is controlled by `--backend-bootstrap` flag (defaults to `false`).

## stack Commands

Work with explicit stack definitions (`terragrunt.stack.hcl`).

```bash
terragrunt stack generate                    # Generate units from stack definition
terragrunt stack run -- apply                # Run command on all stack units
terragrunt stack output                      # Show stack outputs
terragrunt stack clean                       # Remove generated .terragrunt-stack directory
```

## hcl Commands

```bash
terragrunt hcl fmt                    # Format all .hcl files recursively
terragrunt hcl fmt --check            # Check formatting (exit 1 if needed)
terragrunt hcl fmt --diff             # Show formatting diff
terragrunt hcl fmt --file path.hcl    # Format single file
terragrunt hcl fmt --exclude-dir=dir  # Skip directory

terragrunt hcl validate               # Validate HCL syntax
```

## dag graph

Visualize the dependency graph.

```bash
terragrunt dag graph                  # Output DOT format
terragrunt dag graph | dot -Tsvg > graph.svg
```

## info Commands

```bash
terragrunt info print                 # Print resolved configuration info
terragrunt info strict                # Show strict control status
```

## Global Flags

Available on all commands:

| Flag | Description |
|------|-------------|
| `--config PATH` | Path to terragrunt.hcl (override default discovery) |
| `--working-dir PATH` | Change working directory |
| `--download-dir PATH` | Override cache directory |
| `--log-level LEVEL` | trace, debug, info, warn, error |
| `--log-format FORMAT` | text, json, key-value |
| `--log-disable` | Suppress all Terragrunt logging |
| `--no-color` | Disable colored output |
| `--non-interactive` | Disable interactive prompts |
| `--parallelism N` | Max concurrent operations |
| `--strict-mode` | Enable all strict controls |
| `--strict-control NAME` | Enable specific strict control |
| `--no-auto-init` | Disable auto-init |
| `--no-auto-retry` | Disable auto-retry |

## Environment Variables

| Variable | Equivalent Flag |
|----------|----------------|
| `TG_CONFIG` | `--config` |
| `TG_DOWNLOAD_DIR` | `--download-dir` |
| `TG_SOURCE` | `--source` |
| `TG_TF_PATH` | `--tf-path` |
| `TG_IAM_ASSUME_ROLE` | `--iam-assume-role` |
| `TG_NON_INTERACTIVE` | `--non-interactive` |
| `TG_LOG_LEVEL` | `--log-level` |
| `TG_PARALLELISM` | `--parallelism` |
| `TG_NO_AUTO_INIT` | `--no-auto-init` |
| `TG_STRICT_MODE` | `--strict-mode` |

<!--
Source references:
- sources/terragrunt/docs/src/content/docs/04-reference/02-cli/01-overview.mdx
- sources/terragrunt/docs/src/content/docs/04-reference/02-cli/02-commands/
- sources/terragrunt/docs/src/content/docs/04-reference/02-cli/98-global-flags.mdx
-->
