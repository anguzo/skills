---
name: opentofu-state-operations
description: State inspection, manipulation, refactoring with moved/removed blocks, and recovery patterns
---

# State Operations

OpenTofu uses state data to map configuration to real-world infrastructure. While OpenTofu updates state automatically, operational changes like refactoring or manual fixes require explicit state manipulation.

## State Inspection

Use these commands to understand what OpenTofu is currently managing without making changes.

```bash
# List all resources in the current state
tofu state list

# Filter resources by prefix or module
tofu state list 'module.vpc.*'

# Show detailed attributes for a specific resource
tofu state show aws_instance.web

# Pull state to stdout as JSON for inspection or backup
tofu state pull

# Push a local state file to the remote backend
# WARNING: Only use for recovery; can overwrite remote state
tofu state push terraform.tfstate
```

## State Manipulation

Modify the state to track resource renames, module migrations, or to stop managing specific objects.

```bash
# Rename a resource in state (prevents recreation)
tofu state mv aws_instance.old aws_instance.new

# Move a resource into a module
tofu state mv aws_instance.web module.compute.aws_instance.web

# Stop managing a resource without destroying the real object
tofu state rm aws_instance.decommissioned

# Update provider source in state (useful for fork/registry migrations)
tofu state replace-provider hashicorp/aws registry.opentofu.org/hashicorp/aws
```

## Declarative Refactoring (moved blocks)

Instead of manual `tofu state mv` commands, use `moved` blocks in your HCL to record refactoring history. This ensures the change is applied automatically for all users/environments.

```hcl
# Rename a resource
moved {
  from = aws_instance.web_server
  to   = aws_instance.application
}

# Move into a module
moved {
  from = aws_vpc.main
  to   = module.networking.aws_vpc.main
}

# Move between modules
moved {
  from = module.old.aws_s3_bucket.data
  to   = module.new.aws_s3_bucket.data
}

# Rename a module call
moved {
  from = module.old_name
  to   = module.new_name
}

# Handle instance key changes (count/for_each)
moved {
  from = aws_instance.web[0]
  to   = aws_instance.web["primary"]
}
```

Keep `moved` blocks in your configuration permanently to support users upgrading from much older versions.

## Explicit Removal (removed blocks)

Use `removed` blocks to forget resources without destroying them, or to provide a historical record of destruction.

```hcl
# Forget a resource without destroying the remote object
removed {
  from = aws_instance.legacy
  lifecycle {
    destroy = false
  }
}

# Document the destruction of a resource
removed {
  from = aws_instance.temporary
  lifecycle {
    destroy = true
  }
}
```

The `from` address in `removed` blocks cannot include instance keys (e.g., `[0]`).

## State Recovery Patterns

### Safety First
- **Backup before manual edits**: `tofu state pull > backup.tfstate`.
- **Verify plans**: Always run `tofu plan` after state changes to ensure no unexpected recreations are pending.

### Common Recovery Scenarios
- **Force Unlock**: If a process crashes and leaves the state locked.
  ```bash
  tofu force-unlock LOCK_ID
  ```
- **Recover from Backup**: Restore a known good state.
  ```bash
  tofu state push backup.tfstate
  ```
- **Re-import**: If a resource was accidentally removed from state (`state rm`), use an `import` block or `tofu import` to re-establish management.

## Resource Addressing Syntax

Properly addressing resources is critical for all state operations.

| Pattern | Description |
|---------|-------------|
| `aws_instance.web` | A single resource |
| `aws_instance.web[0]` | Instance at index 0 (`count`) |
| `aws_instance.web["key"]` | Instance with specific key (`for_each`) |
| `module.vpc.aws_vpc.main` | Resource inside a child module |
| `module.vpc[0].aws_vpc.main` | Resource inside a specific module instance |

<!--
Source references:
- https://opentofu.org/docs/cli/commands/state/
- https://opentofu.org/docs/language/modules/develop/refactoring/
- https://opentofu.org/docs/language/resources/syntax/#removing-resources
-->
