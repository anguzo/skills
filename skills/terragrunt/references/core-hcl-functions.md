---
name: terragrunt-hcl-functions
description: Terragrunt built-in functions — path helpers, environment, AWS identity, run_cmd, read_terragrunt_config, sops
---

# Terragrunt HCL Functions

Terragrunt supports all OpenTofu/Terraform built-in functions (as of v0.15.3) plus its own functions. `file*` functions resolve relative to the `terragrunt.hcl` directory.

## Path Functions

### find_in_parent_folders

Searches up from current config, returns absolute path to first matching file/folder.

```hcl
include "root" {
  path = find_in_parent_folders("root.hcl")
}
# With fallback (no error if not found):
locals {
  optional = find_in_parent_folders("optional.hcl", "fallback.hcl")
}
```

### path_relative_to_include

Returns relative path from included config to current unit. Used in root configs for unique state keys.

```hcl
# In root.hcl — each unit gets unique state key
remote_state {
  backend = "s3"
  config = {
    key = "${path_relative_to_include()}/terraform.tfstate"
  }
}
```

For multi-include configs, pass the include label: `path_relative_to_include("root")`

### path_relative_from_include

Returns relative path FROM the include back to current unit (inverse of above).

```hcl
terraform {
  source = "${path_relative_from_include()}/../sources//${path_relative_to_include()}"
}
```

### get_terragrunt_dir

Returns absolute path to the directory containing the current `terragrunt.hcl`.

```hcl
terraform {
  extra_arguments "vars" {
    commands  = ["apply", "plan"]
    arguments = ["-var-file=${get_terragrunt_dir()}/../common.tfvars"]
  }
}
```

### get_parent_terragrunt_dir

Returns absolute path to the parent (included) config's directory. For multi-include: `get_parent_terragrunt_dir("root")`.

### get_original_terragrunt_dir

Returns the directory of the originally-invoked `terragrunt.hcl` (useful inside `read_terragrunt_config` calls).

### get_working_dir

Returns absolute path where Terragrunt runs OpenTofu/Terraform (the `.terragrunt-cache` directory).

### get_repo_root

Returns absolute path to Git repository root.

### get_path_from_repo_root

Returns relative path from Git root to current directory. Useful for state keys.

```hcl
config = {
  key = "${get_path_from_repo_root()}/terraform.tfstate"
}
```

### get_path_to_repo_root

Returns relative path TO Git root from current directory.

## Environment Functions

### get_env

```hcl
get_env("BUCKET")                    # Error if unset
get_env("BUCKET", "default-bucket")  # With fallback
```

### get_platform

Returns OS: `darwin`, `linux`, `windows`, `freebsd`.

## AWS Identity Functions

All can change value after `iam_role` evaluation.

```hcl
locals {
  account_id    = get_aws_account_id()
  account_alias = get_aws_account_alias()
  caller_arn    = get_aws_caller_identity_arn()
  user_id       = get_aws_caller_identity_user_id()
}
```

## Command Helper Functions

```hcl
get_terraform_commands_that_need_vars()        # Commands accepting -var/-var-file
get_terraform_commands_that_need_input()       # Commands accepting -input
get_terraform_commands_that_need_locking()     # Commands accepting -lock-timeout
get_terraform_commands_that_need_parallelism() # Commands accepting -parallelism
get_terraform_command()                        # Current command being run
get_terraform_cli_args()                       # Current CLI args list
get_default_retryable_errors()                 # Default retry patterns for errors block
```

## run_cmd

Execute shell commands and use stdout as the value.

```hcl
locals {
  account = run_cmd("aws", "sts", "get-caller-identity", "--query", "Account", "--output", "text")
}
```

### Special flags (must be first arguments)

| Flag | Effect |
|------|--------|
| `--terragrunt-quiet` | Suppress stdout from logs (still returns value) |
| `--terragrunt-global-cache` | Cache result globally (directory-independent) |
| `--terragrunt-no-cache` | Force re-execution every time |

```hcl
# Cached globally (same result regardless of CWD)
account = run_cmd("--terragrunt-global-cache", "aws", "sts", "get-caller-identity", "--query", "Account", "--output", "text")

# Never cached (dynamic value)
timestamp = run_cmd("--terragrunt-no-cache", "date", "+%s")

# Sensitive value hidden from logs
secret = run_cmd("--terragrunt-quiet", "./decrypt.sh", "password")
```

Default caching: keyed by directory + command arguments.

## read_terragrunt_config

Parse another Terragrunt config file and access its blocks/attributes.

```hcl
locals {
  common = read_terragrunt_config(find_in_parent_folders("common.hcl"))
  region = local.common.locals.region
}

inputs = merge(local.common.inputs, {
  extra_tag = "value"
})
```

With fallback: `read_terragrunt_config("optional.hcl", { inputs = {} })`

Also renders `dependency` blocks in the read config, making their outputs accessible.

## read_tfvars_file

Parse a `.tfvars` file into a map.

```hcl
locals {
  vars = jsondecode(read_tfvars_file("common.tfvars"))
}
```

## sops_decrypt_file

Decrypt SOPS-encrypted files (YAML, JSON, ENV, INI, binary).

```hcl
locals {
  secrets = yamldecode(sops_decrypt_file(find_in_parent_folders("secrets.yaml")))
}

inputs = merge(local.secrets, {
  # additional inputs
})
```

## mark_as_read / mark_glob_as_read

Mark files as "read" for `--queue-include-units-reading` / `--filter 'reading=...'`.

```hcl
locals {
  config_file = mark_as_read("/absolute/path/to/config.yaml")
  all_configs = mark_glob_as_read("${get_terragrunt_dir()}/config/{*.yaml,**/*.yaml}")
}
```

Must be called in `locals` block to affect queue construction.

## constraint_check

Check if a version satisfies a constraint.

```hcl
locals {
  needs_v2 = constraint_check("1.5.0", ">= 2.0.0")  # false
}
```

## get_terragrunt_source_cli_flag

Returns the value of `--source` or `TG_SOURCE` (empty string if not set). Useful for detecting local dev mode.

<!--
Source references:
- sources/terragrunt/docs/src/content/docs/04-reference/01-hcl/04-functions.mdx
-->
