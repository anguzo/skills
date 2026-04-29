---
name: terragrunt-units
description: Terragrunt units — remote modules, includes, hooks, extra_arguments, auto-init, state backend, authentication, generate blocks
---

# Terragrunt Units

A **unit** is the smallest deployable entity in Terragrunt — a directory containing a `terragrunt.hcl` file representing one independently managed piece of infrastructure with its own state.

## Core Principles

- Units are hermetic, atomic, independently operable.
- Units reference versioned, immutable OpenTofu/Terraform modules via `source`.
- Changes to a `terragrunt.hcl` = one reproducible change to a limited subset of infrastructure.
- Smaller units = faster updates, easier reasoning, smaller blast radius.

## Remote Modules

Units download OpenTofu/Terraform code from remote sources:

```hcl
terraform {
  source = "git::git@github.com:acme/modules.git//vpc?ref=v1.0.0"
}

inputs = {
  vpc_name = "production"
  cidr     = "10.0.0.0/16"
}
```

The `//` separates repo from module subdirectory. Terragrunt:
1. Downloads code into `.terragrunt-cache`
2. Copies local files from working directory into cache
3. Runs OpenTofu/Terraform in the cache directory
4. Passes `inputs` as `TF_VAR_*` environment variables

### Module Source Formats

| Format | Example |
|--------|---------|
| Git SSH | `git::git@github.com:org/repo.git//module?ref=v1.0` |
| Git HTTPS | `git::https://github.com/org/repo.git//module?ref=v1.0` |
| Local path | `../modules//vpc` |
| Registry (tfr) | `tfr:///terraform-aws-modules/vpc/aws?version=3.3.0` |
| Private registry | `tfr://registry.example.com/org/module/provider?version=1.0` |
| S3 | `s3::https://bucket.s3.amazonaws.com/module.zip` |

Private registry auth: set `TG_TF_REGISTRY_TOKEN` environment variable.

### Local Development

Override source for rapid iteration:

```bash
terragrunt apply --source ../../../local-modules//vpc
# Or via environment:
export TG_SOURCE="../../../local-modules//vpc"
```

## Include Patterns

Share common configuration across units:

```hcl
# root.hcl (at repo root)
remote_state {
  backend = "s3"
  config = {
    bucket = "my-state-${get_aws_account_id()}"
    key    = "${path_relative_to_include()}/terraform.tfstate"
    region = "us-east-1"
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  region = "us-east-1"
}
EOF
}
```

```hcl
# units/vpc/terragrunt.hcl
include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "git::git@github.com:acme/modules.git//vpc?ref=v1.0.0"
}

inputs = {
  vpc_name = "production"
}
```

### Multiple Includes

```hcl
include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "env" {
  path           = find_in_parent_folders("env.hcl")
  expose         = true
  merge_strategy = "no_merge"
}

inputs = {
  environment = include.env.locals.environment
}
```

## Generate Blocks

Inject files (provider configs, backend configs, etc.) into the working directory before OpenTofu/Terraform runs:

```hcl
generate "versions" {
  path      = "versions.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
EOF
}
```

## Auto-Init

Terragrunt automatically runs `tofu init` when:
- `.terraform` directory doesn't exist
- Module source changed
- Backend configuration changed

Disable with `--no-auto-init` or `TG_NO_AUTO_INIT=true`.

## State Backend Bootstrapping

Using `remote_state` block, Terragrunt auto-creates S3 buckets and DynamoDB tables:

```hcl
remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket         = "company-terraform-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

Auto-creation requires `--backend-bootstrap` flag (defaults to `false`). Resources created with encryption, versioning, and access policies.

## Authentication (IAM Role Assumption)

```hcl
# Assume role before any OpenTofu/Terraform command
iam_role = "arn:aws:iam::${local.account_id}:role/deploy"

# Or with OIDC for CI/CD (no static creds)
iam_role               = "arn:aws:iam::123456789012:role/github-deploy"
iam_web_identity_token = get_env("ACTIONS_ID_TOKEN_REQUEST_TOKEN")
```

## Lock Files

`.terraform.lock.hcl` files are managed by Terragrunt:
- Generated in `.terragrunt-cache`
- Copied back to unit directory (next to `terragrunt.hcl`)
- Should be committed to version control

Disable copy-back: `copy_terraform_lock_file = false` in `terraform` block.

## Working with Relative Paths

**Important:** OpenTofu/Terraform runs in `.terragrunt-cache`, not your unit directory. Relative paths in CLI args resolve against the cache.

- CLI: Use absolute paths (`terragrunt apply -var-file /abs/path/extra.tfvars`)
- Config: Use `get_terragrunt_dir()` for relative paths:

```hcl
arguments = ["-var-file=${get_terragrunt_dir()}/../common.tfvars"]
```

<!--
Source references:
- sources/terragrunt/docs/src/content/docs/03-features/01-units/index.mdx
- sources/terragrunt/docs/src/content/docs/03-features/01-units/02-includes.mdx
- sources/terragrunt/docs/src/content/docs/03-features/01-units/03-state-backend.mdx
- sources/terragrunt/docs/src/content/docs/03-features/01-units/06-hooks.mdx
- sources/terragrunt/docs/src/content/docs/03-features/01-units/07-auto-init.mdx
-->
