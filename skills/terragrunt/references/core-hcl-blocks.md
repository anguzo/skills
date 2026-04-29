---
name: terragrunt-hcl-blocks
description: Terragrunt HCL configuration blocks — terraform, remote_state, include, dependency, dependencies, generate, feature, errors, locals
---

# Terragrunt HCL Blocks

Configuration blocks define structural configuration for Terragrunt systems. Blocks control how Terragrunt interacts with OpenTofu/Terraform, manages state, resolves dependencies, and generates code.

## terraform

Configures how Terragrunt interacts with OpenTofu/Terraform.

```hcl
terraform {
  source = "git::git@github.com:acme/modules.git//vpc?ref=v1.0.0"

  # Copy hidden files from working dir to .terragrunt-cache
  include_in_copy = [".python-version", "*.yaml"]
  exclude_from_copy = ["*.secret"]

  # Keep lock file in working directory
  copy_terraform_lock_file = true

  extra_arguments "retry_lock" {
    commands  = get_terraform_commands_that_need_locking()
    arguments = ["-lock-timeout=20m"]
  }

  extra_arguments "custom_vars" {
    commands           = ["apply", "plan", "import", "refresh"]
    required_var_files = ["${get_parent_terragrunt_dir()}/common.tfvars"]
    optional_var_files = ["${get_terragrunt_dir()}/override.tfvars"]
    env_vars           = { TF_VAR_region = "us-east-1" }
  }

  before_hook "validate" {
    commands = ["apply"]
    execute  = ["tflint"]
  }

  after_hook "notify" {
    commands     = ["apply"]
    execute      = ["./notify.sh"]
    run_on_error = true
  }

  error_hook "handle_download_failure" {
    commands  = ["init-from-module"]
    execute   = ["echo", "Source download failed"]
    on_errors = [".*"]
  }
}
```

### Key attributes

- `source`: Module location (git URLs, local paths, `tfr://` registry protocol). Supports same syntax as Terraform module sources. Double-slash `//` separates repo from subdirectory path.
- `include_in_copy` / `exclude_from_copy`: Glob patterns for files to include/exclude when copying to `.terragrunt-cache`.
- `copy_terraform_lock_file`: Whether to copy `.terraform.lock.hcl` back from cache (default: `true`).

### extra_arguments

Pass additional CLI flags to OpenTofu/Terraform commands:
- `arguments` (required): List of CLI arguments.
- `commands` (required): List of subcommands to target.
- `env_vars` (optional): Map of environment variables.
- `required_var_files` / `optional_var_files`: Paths to `.tfvars` files.

### Hooks (before_hook, after_hook, error_hook)

- `commands` (required): Which OpenTofu/Terraform commands trigger the hook.
- `execute` (required): Command and arguments to run.
- `run_on_error` (optional): Run even if previous hook or terraform failed (default: false).
- `working_dir` (optional): Override working directory.
- `if` (optional): Skip hook when evaluates to `false`.
- `on_errors` (error_hook only): Regex patterns matching error messages.
- `suppress_stdout` (optional): Hide stdout output.

Special hook commands: `read-config` (after only), `init-from-module`, `init`.

Hook environment variables: `TG_CTX_TF_PATH`, `TG_CTX_COMMAND`, `TG_CTX_HOOK_NAME`.

## remote_state

Configures OpenTofu/Terraform remote state backend with optional automatic resource provisioning.

```hcl
remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket         = "my-terraform-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "my-lock-table"
  }
}
```

### Key attributes

- `backend`: Backend type (`s3`, `gcs`, `local`, etc.).
- `generate`: Where to write the generated backend config (`path`, `if_exists`).
- `config`: Backend configuration map (bucket, key, region, etc.).
- `disable_init`: Skip automatic backend resource creation by Terragrunt.
- `disable_dependency_optimization`: Disable optimized dependency output fetching.
- `encryption`: OpenTofu state encryption config (key_provider: pbkdf2, aws_kms, gcp_kms, openbao).

### S3 backend extras (Terragrunt-only)

- `skip_bucket_versioning`, `skip_bucket_ssencryption`, `skip_bucket_root_access`, `skip_bucket_enforced_tls`
- `enable_lock_table_ssencryption`, `s3_bucket_tags`, `dynamodb_table_tags`
- `accesslogging_bucket_name`, `accesslogging_target_prefix`
- `use_lockfile`: Enable native S3 locking (OpenTofu >= 1.10).
- `disable_bucket_update`: Prevent auto-updating bucket config.

### GCS backend extras

- `skip_bucket_creation`, `skip_bucket_versioning`, `enable_bucket_policy_only`
- `project`, `location`, `gcs_bucket_labels`

## include

Merges configuration from parent files into the current unit.

```hcl
include "root" {
  path           = find_in_parent_folders("root.hcl")
  expose         = true
  merge_strategy = "deep"  # no_merge | shallow (default) | deep
}
```

- `path`: Absolute path to parent config.
- `expose`: Make parent config accessible as `include.<label>.*` (default: false).
- `merge_strategy`: How to merge parent/child config.

### Deep merge rules

- Simple types: child overrides parent.
- Lists: concatenated.
- Maps: recursively merged (overlapping keys → deep merge on values).
- Blocks: same label → recursive merge; different labels → appended.
- Exception: `remote_state` and `generate` always shallow-merge (child replaces parent).
- `locals` are NOT merged — use `expose` to access parent locals.
- `dependency` blocks are shared bidirectionally when using deep merge.

## dependency

Declares a dependency on another unit to access its outputs.

```hcl
dependency "vpc" {
  config_path = "../vpc"

  mock_outputs = {
    vpc_id     = "vpc-mock-123"
    subnet_ids = ["subnet-mock-1", "subnet-mock-2"]
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
  mock_outputs_merge_strategy_with_state  = "shallow"
}

inputs = {
  vpc_id = dependency.vpc.outputs.vpc_id
}
```

- `config_path` (required): Relative path to the dependency unit directory.
- `mock_outputs`: Fake outputs for commands that can't resolve real state (plan on fresh deploy).
- `mock_outputs_allowed_terraform_commands`: Only use mocks for these commands.
- `mock_outputs_merge_strategy_with_state`: `shallow` (default) or `deep` — how mocks merge with real outputs.
- `skip_outputs`: Skip fetching outputs entirely (useful with `dependencies` for DAG ordering only).
- `enabled`: Conditionally enable/disable the dependency.

Access outputs: `dependency.<name>.outputs.<output_name>`

## dependencies

Declares ordering dependencies WITHOUT fetching outputs.

```hcl
dependencies {
  paths = ["../vpc", "../mysql", "../redis"]
}
```

Used purely for DAG ordering. Does not expose outputs. Merged (concatenated) during includes.

## generate

Generates files in the OpenTofu/Terraform working directory before commands run.

```hcl
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  region = "us-east-1"
  assume_role {
    role_arn = "arn:aws:iam::123456789012:role/terragrunt"
  }
}
EOF
}
```

- `path`: Output filename.
- `if_exists`: `overwrite` | `overwrite_terragrunt` | `skip` | `error`.
- `contents`: File content (supports interpolation).
- `comment_prefix` (optional): Prefix for the generation comment header.
- `disable_signature` (optional): Omit the Terragrunt signature comment.

## feature

Feature flags for dynamic configuration control.

```hcl
feature "new_module_version" {
  default = false
}

inputs = feature.new_module_version.value ? {
  new_input = "value"
} : {
  old_input = "value"
}
```

Override at runtime: `terragrunt run --feature new_module_version=true -- apply`

## errors

Configure error handling with retry logic and custom ignore patterns.

```hcl
errors {
  retry "transient_errors" {
    retryable_errors   = get_default_retryable_errors()
    max_attempts       = 3
    sleep_interval_sec = 5
  }

  retry "custom_errors" {
    retryable_errors   = [".*TLS handshake timeout.*"]
    max_attempts       = 5
    sleep_interval_sec = 10
  }

  ignore "known_warnings" {
    ignorable_errors = [".*Warning.*"]
    message          = "Ignoring known warnings"
    signals = {
      warning_detected = true
    }
  }
}
```

## locals

Define named expressions for reuse within the same file.

```hcl
locals {
  account_id   = get_aws_account_id()
  region       = "us-east-1"
  env_vars     = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  environment  = local.env_vars.locals.environment
}
```

Accessible via `local.<name>`. Parsed before `dependency` blocks — cannot reference dependency outputs.

## unit (in terragrunt.stack.hcl)

Defines an infrastructure unit within an explicit stack blueprint.

```hcl
unit "vpc" {
  source = "git::git@github.com:acme/catalog.git//units/vpc?ref=v1.0.0"
  path   = "vpc"
  values = {
    vpc_name = "main"
    cidr     = "10.0.0.0/16"
  }
}
```

## stack (in terragrunt.stack.hcl)

Defines a nested stack reference within an explicit stack blueprint.

```hcl
stack "prod" {
  source = "git::git@github.com:acme/catalog.git//stacks/environment?ref=v1.0.0"
  path   = "prod"
  values = {
    environment = "production"
    cidr        = "10.1.0.0/16"
  }
}
```

## Configuration Parsing Order

1. `include` block
2. `locals` block
3. `iam_role` / `iam_assume_role_*` / `iam_web_identity_token` evaluation
4. `dependencies` block
5. `dependency` blocks (fetches outputs)
6. Everything else
7. Included config resolution
8. Merge operation

**Rule:** Earlier-parsed blocks cannot reference later-parsed blocks (e.g., `locals` cannot use `dependency` outputs).

<!--
Source references:
- sources/terragrunt/docs/src/content/docs/04-reference/01-hcl/02-blocks.mdx
- sources/terragrunt/docs/src/content/docs/04-reference/01-hcl/01-overview.mdx
-->
