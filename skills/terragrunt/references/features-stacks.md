---
name: terragrunt-stacks
description: Terragrunt stacks — implicit/explicit stacks, terragrunt.stack.hcl, unit/stack blocks, run queue, DAG ordering, dependency management
---

# Terragrunt Stacks

A **stack** is a collection of related units managed together. Stacks enable deploying multiple infrastructure components with a single command while managing inter-unit dependencies automatically.

## Implicit Stacks

Created by organizing units in a directory hierarchy. Any directory containing child units is implicitly a stack.

```
live/
├── root.hcl
├── prod/
│   ├── vpc/
│   │   └── terragrunt.hcl
│   ├── database/
│   │   └── terragrunt.hcl
│   └── app/
│       └── terragrunt.hcl
└── dev/
    ├── vpc/
    │   └── terragrunt.hcl
    └── app/
        └── terragrunt.hcl
```

```bash
cd live/prod
terragrunt run --all -- apply    # Deploys vpc → database → app (respecting DAG)
```

**Use when:** Small number of units, each unique, maximum explicitness, getting started.

## Explicit Stacks

Defined with `terragrunt.stack.hcl` files — blueprints that generate units programmatically.

```hcl
# terragrunt.stack.hcl

unit "vpc" {
  source = "git::git@github.com:acme/catalog.git//units/vpc?ref=v1.0.0"
  path   = "vpc"
  values = {
    vpc_name = "main"
    cidr     = "10.0.0.0/16"
  }
}

unit "database" {
  source = "git::git@github.com:acme/catalog.git//units/database?ref=v1.0.0"
  path   = "database"
  values = {
    engine   = "postgres"
    vpc_path = "../vpc"
  }
}
```

### Workflow

```bash
terragrunt stack generate    # Creates .terragrunt-stack/ with generated units
terragrunt stack run -- apply   # Run across all generated units
```

Generated structure:
```
.terragrunt-stack/
├── vpc/
│   ├── terragrunt.hcl
│   └── terragrunt.values.hcl
└── database/
    ├── terragrunt.hcl
    └── terragrunt.values.hcl
```

### Nested Stacks

Reference other stack blueprints for reusable patterns:

```hcl
stack "dev" {
  source = "git::git@github.com:acme/catalog.git//stacks/environment?ref=v1.0.0"
  path   = "dev"
  values = {
    environment = "development"
    cidr        = "10.0.0.0/16"
  }
}

stack "prod" {
  source = "git::git@github.com:acme/catalog.git//stacks/environment?ref=v1.0.0"
  path   = "prod"
  values = {
    environment = "production"
    cidr        = "10.1.0.0/16"
  }
}
```

**Use when:** Multiple environments, reusable infrastructure patterns, many similar units, versioned collections.

## Dependency Management

### dependency block (data + ordering)

Fetches outputs from another unit AND establishes DAG ordering:

```hcl
dependency "vpc" {
  config_path = "../vpc"
  mock_outputs = {
    vpc_id = "vpc-mock"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

inputs = {
  vpc_id = dependency.vpc.outputs.vpc_id
}
```

### dependencies block (ordering only)

Establishes DAG ordering without fetching outputs:

```hcl
dependencies {
  paths = ["../vpc", "../security-groups"]
}
```

## Run Queue & DAG

The Run Queue orchestrates execution order across units in a stack.

### How it works

1. **Discovery:** Find all units in working directory tree.
2. **DAG construction:** Build dependency graph from `dependency`/`dependencies` blocks.
3. **Queue ordering:** Apply/plan = dependencies first; destroy = dependents first.
4. **Parallel execution:** Dequeue units respecting DAG + `--parallelism` limit.

### Execution order example

```
app → database → vpc (dependency chain)
```

- `run --all apply`: vpc → database → app
- `run --all destroy`: app → database → vpc
- Independent units run concurrently.

### Key flags

```bash
# Max concurrent units
terragrunt run --all --parallelism 5 -- apply

# Ignore DAG order (safe for plan/validate only!)
terragrunt run --all --queue-ignore-dag-order -- plan

# Continue on failure
terragrunt run --all --queue-ignore-errors -- plan

# Stop immediately on first failure
terragrunt run --all --fail-fast -- apply

# Preview order without executing
terragrunt list --as destroy --long
```

### Important behaviors

- `run --all apply/destroy` adds `-auto-approve` automatically (shared stdin limitation).
- `run --all plan` fails if dependencies have never been applied (can't resolve outputs) — use `mock_outputs`.
- Do NOT set `TF_PLUGIN_CACHE_DIR` with `run --all` — use Terragrunt's provider cache server instead.

## Stack Commands

```bash
terragrunt stack generate       # Generate units from .stack.hcl blueprints
terragrunt stack run -- apply   # Run across generated units
terragrunt stack output         # Show outputs from all stack units
terragrunt stack clean          # Remove .terragrunt-stack/ directory
```

`stack run` and `run --all` both auto-generate from `terragrunt.stack.hcl` files.

## Passing Outputs Between Units

```hcl
# database/terragrunt.hcl
dependency "vpc" {
  config_path = "../vpc"
}

inputs = {
  subnet_ids = dependency.vpc.outputs.private_subnet_ids
  vpc_id     = dependency.vpc.outputs.vpc_id
}
```

### Mock outputs for fresh deployments

```hcl
dependency "vpc" {
  config_path = "../vpc"
  mock_outputs = {
    vpc_id             = "vpc-00000000"
    private_subnet_ids = ["subnet-00000001", "subnet-00000002"]
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}
```

Mocks are used when real state doesn't exist yet (first `plan` before any `apply`).

<!--
Source references:
- sources/terragrunt/docs/src/content/docs/03-features/02-stacks/index.mdx
- sources/terragrunt/docs/src/content/docs/03-features/02-stacks/02-implicit.mdx
- sources/terragrunt/docs/src/content/docs/03-features/02-stacks/03-explicit.mdx
- sources/terragrunt/docs/src/content/docs/03-features/02-stacks/06-run-queue.mdx
- sources/terragrunt/docs/src/content/docs/03-features/02-stacks/04-stack-operations.mdx
-->
