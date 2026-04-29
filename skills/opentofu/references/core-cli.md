---
name: opentofu-cli-commands
description: Essential OpenTofu CLI commands for infrastructure management, planning, applying, and state operations
---

# OpenTofu CLI Commands

The `tofu` CLI is the primary interface for managing infrastructure. These commands cover the standard lifecycle from initialization to destruction.

## core-init

Initializes a working directory. This is the first command to run for any new or cloned configuration.

### Usage
```bash
tofu init [options]
```

### Key Flags
- `-upgrade`: Updates all modules and plugins to the newest versions allowed by constraints.
- `-backend-config=path/to/config.hcl`: Sets [partial backend configuration](https://opentofu.org/docs/language/settings/backends/configuration/#partial-configuration) dynamically.
- `-reconfigure`: Ignores any existing state and re-initializes from scratch.
- `-migrate-state`: Re-initializes the backend and attempts to migrate existing state to the new configuration.
- `-lock=false`: Disables state locking (dangerous in shared environments).
- `-var 'name=value'`: Sets a root module variable.
- `-var-file=filename`: Loads variable values from a `.tfvars` file.

## core-plan

Generates an execution plan, showing what actions OpenTofu will take to reach the desired state.

### Usage
```bash
tofu plan [options]
```

### Key Flags
- `-out=tfplan`: Saves the plan to a file for use with `tofu apply`.
- `-target=address`: Limits planning to a specific resource (e.g., `-target=module.vpc`). Use only for exceptional recovery.
- `-replace=address`: Forces replacement of a resource even if no changes are required (e.g., `-replace=aws_instance.web`).
- `-refresh-only`: Updates the state to match remote objects without proposing changes to infrastructure.
- `-destroy`: Generates a plan to destroy all managed resources.
- `-detailed-exitcode`: Returns 0 (no changes), 1 (error), or 2 (changes present). Useful for CI/CD.
- `-json`: Outputs the plan in machine-readable JSON format.

## core-apply

Executes the actions proposed in a plan.

### Usage
```bash
# Automatic plan and apply
tofu apply [options]

# Apply a saved plan file
tofu apply [options] tfplan
```

### Key Flags
- `-auto-approve`: Skips interactive confirmation (use with caution in production).
- `-input=false`: Disables interactive prompts; fails if unassigned variables exist.
- `-parallelism=n`: Limits the number of concurrent operations (default: 10).
- `-var 'token=$TOKEN'`: **Ephemeral variables** must be re-specified when applying a saved plan if they were used during planning.

## core-destroy

Destroys all objects managed by the configuration.

### Usage
```bash
tofu destroy [options]
```
This is a convenience alias for `tofu apply -destroy`.

### Key Points
- **Forgotten Resources**: Resources with `lifecycle { prevent_destroy = true }` or `lifecycle { destroy = false }` will be removed from state but not deleted from the provider.
- Use `-suppress-forget-errors` to exit with status 0 even when resources are forgotten.

## core-fmt

Rewrites configuration files to a canonical format and style.

### Usage
```bash
tofu fmt [options] [target...]
```

### Key Flags
- `-recursive`: Processes files in subdirectories.
- `-check`: Returns a non-zero exit code if files require formatting.
- `-diff`: Displays the formatting changes.

## core-validate

Verifies the syntax and internal consistency of configuration files.

### Usage
```bash
tofu validate [options]
```
Requires an initialized directory (`tofu init`). Use `tofu init -backend=false` for quick validation without backend access.

## core-output

Extracts values for output variables from the state file.

### Usage
```bash
tofu output [options] [NAME]
```

### Key Flags
- `-json`: Returns all outputs as a JSON object.
- `-raw`: Prints the raw string value (useful for shell scripts).
- `-show-sensitive`: Displays values marked as sensitive.

## core-console

Interactive shell for evaluating expressions and testing functions.

### Usage
```bash
tofu console [options]
```
- Evaluate resource attributes: `aws_instance.web.public_ip`
- Test functions: `cidrsubnet("10.0.0.0/8", 8, 2)`
- Filter maps: `{ for k, v in var.apps : k => v if v.region == "us-east-1" }`

## core-import

Brings existing infrastructure under OpenTofu management.

### Usage
```bash
tofu import [options] ADDRESS ID
```
Example: `tofu import aws_instance.web i-12345678`

## core-graph

Generates a visual representation of the configuration or plan in DOT format.

### Usage
```bash
tofu graph [options] | dot -Tsvg > graph.svg
```

---

## Usage Patterns

### Plan File Workflow
The recommended workflow for automation to ensure the applied changes match the reviewed plan:
```bash
tofu plan -out=tfplan
tofu apply tfplan
```

### Targeting and Replacing
```bash
# Target only the VPC module
tofu plan -target=module.vpc

# Force replacement of a specific instance
tofu plan -replace=aws_instance.web
```

### Refresh-only
Reconcile state with external changes without modifying infrastructure:
```bash
tofu plan -refresh-only
tofu apply -refresh-only
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TF_VAR_name` | Sets the value for the input variable `name`. |
| `TF_CLI_ARGS` | Additional arguments to append to all commands. |
| `TF_CLI_ARGS_plan` | Additional arguments for the `plan` command only. |
| `TF_LOG` | Enables debug logging (`trace`, `debug`, `info`, `warn`, `error`). |
| `TF_INPUT` | Set to `0` or `false` to disable interactive prompts. |
| `TF_IN_AUTOMATION` | Adjusts output to avoid suggesting next steps (cosmetic). |

<!--
Source references:
- sources/opentofu/website/docs/cli/commands/plan.mdx
- sources/opentofu/website/docs/cli/commands/apply.mdx
- sources/opentofu/website/docs/cli/commands/init.mdx
- sources/opentofu/website/docs/cli/commands/destroy.mdx
- sources/opentofu/website/docs/cli/commands/fmt.mdx
- sources/opentofu/website/docs/cli/commands/validate.mdx
-->
