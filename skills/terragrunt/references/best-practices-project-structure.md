---
name: terragrunt-project-structure
description: Terragrunt project layout — two-repo pattern, root.hcl conventions, multi-environment DRY patterns, include hierarchy, locals for shared values
---

# Terragrunt Project Structure

Best practices for organizing Terragrunt repositories at scale.

## Two-Repo Pattern (Recommended)

Separate **modules** (reusable OpenTofu/Terraform code) from **live** (environment-specific Terragrunt config):

```
# Repo 1: modules (versioned, immutable)
modules/
├── vpc/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── database/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── app/
    ├── main.tf
    ├── variables.tf
    └── outputs.tf

# Repo 2: live (environment config)
live/
├── root.hcl
├── prod/
│   ├── env.hcl
│   ├── account.hcl
│   ├── vpc/
│   │   └── terragrunt.hcl
│   ├── database/
│   │   └── terragrunt.hcl
│   └── app/
│       └── terragrunt.hcl
├── staging/
│   ├── env.hcl
│   ├── vpc/
│   │   └── terragrunt.hcl
│   └── app/
│       └── terragrunt.hcl
└── dev/
    ├── env.hcl
    ├── vpc/
    │   └── terragrunt.hcl
    └── app/
        └── terragrunt.hcl
```

**Why two repos:**
- Modules are versioned with Git tags (`?ref=v1.0.0`)
- Promote immutable versions through environments (dev → staging → prod)
- Module changes require explicit version bump in live repo
- Clear separation of concerns

## root.hcl (Top-Level Shared Config)

Place at the repository root. All units include it. Contains backend, provider, and common settings:

```hcl
# root.hcl
locals {
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl"))
  region_vars  = read_terragrunt_config(find_in_parent_folders("region.hcl"))
  env_vars     = read_terragrunt_config(find_in_parent_folders("env.hcl"))

  account_id   = local.account_vars.locals.account_id
  aws_region   = local.region_vars.locals.aws_region
  environment  = local.env_vars.locals.environment
}

# State backend — path auto-derived from directory structure
remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket         = "company-tfstate-${local.account_id}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = local.aws_region
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# Provider generation
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  region = "${local.aws_region}"
  default_tags {
    tags = {
      Environment = "${local.environment}"
      ManagedBy   = "terragrunt"
    }
  }
}
EOF
}
```

## Include Hierarchy

Layer shared config at different directory levels:

```hcl
# live/prod/us-east-1/app/terragrunt.hcl
include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "env" {
  path           = find_in_parent_folders("env.hcl")
  expose         = true       # Makes env.hcl locals accessible via include.env
  merge_strategy = "no_merge" # Don't merge, just expose
}

terraform {
  source = "git::git@github.com:acme/modules.git//app?ref=v2.1.0"
}

inputs = {
  environment    = include.env.locals.environment
  instance_count = 10
  instance_type  = "m8g.large"
}
```

### Common config files at each level

```
live/
├── root.hcl              # Backend, provider, global defaults
├── prod/
│   ├── account.hcl       # locals { account_id = "123456789012" }
│   ├── env.hcl           # locals { environment = "production" }
│   ├── us-east-1/
│   │   ├── region.hcl    # locals { aws_region = "us-east-1" }
│   │   ├── vpc/
│   │   │   └── terragrunt.hcl
│   │   └── app/
│   │       └── terragrunt.hcl
│   └── eu-west-1/
│       ├── region.hcl    # locals { aws_region = "eu-west-1" }
│       └── vpc/
│           └── terragrunt.hcl
```

Each level adds specificity:
- **root.hcl**: Backend, provider template, universal defaults
- **account.hcl**: AWS account ID, account-level settings
- **env.hcl**: Environment name, environment-specific feature flags
- **region.hcl**: AWS region, region-specific settings

## Keeping Units DRY

### Minimal unit files

Each `terragrunt.hcl` should contain only:
1. `include` blocks (to inherit shared config)
2. `terraform.source` (versioned module reference)
3. `inputs` (environment-specific variable values)
4. `dependency` blocks (when outputs from other units are needed)

```hcl
# Ideal unit — minimal, focused, DRY
include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "git::git@github.com:acme/modules.git//database?ref=v1.3.0"
}

dependency "vpc" {
  config_path = "../vpc"
}

inputs = {
  vpc_id     = dependency.vpc.outputs.vpc_id
  subnet_ids = dependency.vpc.outputs.private_subnet_ids
  engine     = "postgres"
  version    = "16.2"
}
```

### Version promotion workflow

```bash
# 1. Update module in staging
# staging/app/terragrunt.hcl: source = "...//app?ref=v2.2.0"
cd live/staging/app && terragrunt apply

# 2. Test in staging...

# 3. Promote same version to prod
# prod/app/terragrunt.hcl: source = "...//app?ref=v2.2.0"
cd live/prod/app && terragrunt apply
```

## Key Conventions

- **State key = directory path**: Use `path_relative_to_include()` so state keys auto-derive from directory structure.
- **One unit per resource group**: vpc, database, app, dns — each independent.
- **Small blast radius**: Keep units small so `apply` affects minimal infrastructure.
- **Lock files committed**: `.terraform.lock.hcl` next to `terragrunt.hcl`, in version control.
- **`.terragrunt-cache` in .gitignore**: Never commit cache directories.
- **Tag modules, not live repo**: Modules repo uses semver tags; live repo uses branch/PR workflow.

<!--
Source references:
- sources/terragrunt/docs/src/content/docs/03-features/01-units/index.mdx
- sources/terragrunt/docs/src/content/docs/03-features/01-units/02-includes.mdx
- sources/terragrunt/docs/src/content/docs/03-features/02-stacks/index.mdx
- https://github.com/gruntwork-io/terragrunt-infrastructure-live-example
- https://github.com/gruntwork-io/terragrunt-infrastructure-modules-example
-->
