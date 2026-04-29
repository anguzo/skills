---
name: opentofu-enabled-lifecycle
description: The enabled meta-argument for conditional resources and advanced lifecycle block configuration
---

# Enabled Meta-Argument and Lifecycle

The `lifecycle` block in OpenTofu provides fine-grained control over how resources are created, updated, and destroyed. OpenTofu v1.11 introduces the `enabled` meta-argument, offering a native way to conditionally manage resources.

## The `enabled` Meta-Argument (v1.11+)

The `enabled` argument determines if a resource or module should be created. It replaces the common `count` hack for conditional resources.

```hcl
variable "create_monitoring" {
  type    = bool
  default = true
}

resource "aws_cloudwatch_metric_alarm" "cpu" {
  alarm_name = "high-cpu"
  # ...
  lifecycle {
    enabled = var.create_monitoring
  }
}

# When enabled = true: aws_cloudwatch_metric_alarm.cpu is created
# When enabled = false: aws_cloudwatch_metric_alarm.cpu evaluates to null
```

### Key Differences from `count`

| Feature | `count = var.enabled ? 1 : 0` | `lifecycle { enabled = var.enabled }` |
|---------|------------------------------|--------------------------------------|
| **Access** | Requires index: `resource[0]` | Direct: `resource` |
| **Disabled State** | Empty list `[]` | `null` |
| **Readability** | Obscures intent | Explicitly conditional |
| **Migration** | Manual state moving | Automatic state migration |

### Restrictions
- Cannot use `enabled` together with `count` or `for_each`.
- Must be placed inside the `lifecycle` block.
- The expression must resolve to a boolean known during the `plan` phase.
- Does not support values known only after `apply`.

## Advanced Lifecycle Options

The `lifecycle` block supports several arguments to customize resource behavior.

```hcl
resource "aws_instance" "web" {
  # ...
  lifecycle {
    create_before_destroy = true
    prevent_destroy       = true
    ignore_changes        = [tags, ami]
    replace_triggered_by  = [null_resource.trigger.id]
    
    precondition {
      condition     = var.instance_type != "t2.micro"
      error_message = "Production must not use t2.micro"
    }
    
    postcondition {
      condition     = self.public_ip != ""
      error_message = "Instance must have a public IP"
    }
  }
}
```

### Core Arguments
- **`create_before_destroy`**: Creates the replacement object before destroying the old one. Useful for zero-downtime updates.
- **`prevent_destroy`**: Rejects any plan that would destroy the resource. Use for critical infrastructure like production databases.
- **`ignore_changes`**: Lists attributes that OpenTofu should ignore after creation. Use `all` to ignore all updates.
- **`replace_triggered_by`**: Forces replacement when referenced resources or attributes change.
- **`destroy`**: When set to `false`, OpenTofu "forgets" the resource (removes from state) instead of destroying the real object.

## Refactoring Tools

### `removed` Block
Forget a resource without destroying the actual infrastructure.

```hcl
removed {
  from = aws_instance.old_server
  lifecycle {
    destroy = false
  }
}
```

### `moved` Block
Refactor configurations by renaming or moving resources without recreation.

```hcl
moved {
  from = aws_instance.old_name
  to   = aws_instance.new_name
}
```

<!--
Source references:
- https://opentofu.org/docs/language/meta-arguments/enabled/
- https://opentofu.org/docs/language/resources/behavior/#lifecycle-customizations
-->
