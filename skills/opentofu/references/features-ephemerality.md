---
name: opentofu-ephemerality
description: Ephemeral resources, variables, outputs, and write-only attributes that never persist in state or plan files
---

# Ephemerality

Ephemeral values exist only during a single `tofu` command execution. Unlike `sensitive` values, which are hidden from the UI but still stored in plaintext in the state, ephemeral values are never stored in state or plan files. This enables safe handling of transient or confidential information like temporary credentials, network tunnels, or session keys.

## Ephemeral Variables and Outputs

Variables and outputs can be marked as `ephemeral = true`. If a value is derived from an ephemeral source, it must be marked as ephemeral.

### Ephemeral Variables
Used to pass secrets into a configuration without them being saved to the state.
```hcl
variable "db_password" {
  type      = string
  ephemeral = true
  sensitive = true # Recommended to also hide from UI
}
```

### Ephemeral Outputs
Mandatory when the output value references an ephemeral source.
```hcl
output "connection_string" {
  value     = "postgres://admin:${var.db_password}@${aws_db_instance.main.endpoint}/mydb"
  ephemeral = true
}
```

## Ephemeral Resources

Ephemeral resources are temporary objects that are "opened" at the start of a phase and "closed" at the end. They are typically used for fetching secrets or creating temporary access.

### Usage Pattern
```hcl
ephemeral "aws_secretsmanager_secret_version" "db_creds" {
  secret_id = aws_secretsmanager_secret.db.id
}

# Use in provider configuration
provider "postgresql" {
  host     = aws_db_instance.main.address
  password = ephemeral.aws_secretsmanager_secret_version.db_creds.secret_string
}
```

### Lifecycle and `enabled`
The `enabled` meta-argument can control when an ephemeral resource is active. Use `terraform.applying` to restrict resources to the apply phase (e.g., for provisioner-only credentials).

```hcl
ephemeral "vault_generic_secret" "temp_token" {
  path = "secret/deploy-token"
  lifecycle {
    enabled = terraform.applying # Only fetch during apply
  }
}
```

## Write-Only Attributes

Write-only attributes are resource arguments designed to accept ephemeral values. They are sent to the provider but recorded as `null` in the state and plan.

### Versioning Updates
Since OpenTofu cannot detect changes in write-only attributes (as state is always `null`), providers usually implement a companion versioning attribute to trigger updates.

```hcl
resource "aws_secretsmanager_secret_version" "example" {
  secret_id                = aws_secretsmanager_secret.example.id
  secret_string_wo         = var.secret_value  # write-only: never in state
  secret_string_wo_version = var.secret_version # bump this to trigger update
}
```

## Value Flow Constraints

Ephemeral values are restricted to specific "safe" sinks to prevent accidental persistence.

### Allowed Destinations
- **Provider configuration blocks**: Initializing providers with transient credentials.
- **Provisioner and connection blocks**: Using secrets in `local-exec`, `remote-exec`, or SSH connections.
- **Write-only attributes**: Sending secrets to resources that support write-only inputs.
- **Other ephemeral variables/outputs**: Passing ephemeral data between modules.
- **Locals**: Transforming ephemeral data within a module.

### Forbidden Destinations
- **Standard resource arguments**: Cannot be used in normal attributes (except write-only ones).
- **Non-ephemeral outputs**: Prevents accidental exposure via standard outputs.
- **State files**: Technically impossible by design.

## The `ephemeralasnull()` Function

This function strips ephemerality by replacing ephemeral values with `null`. It is useful for conditional logic where you only need to know if a value *exists* without actually using its content in a restricted sink.

```hcl
locals {
  # Returns true if the ephemeral variable is provided
  has_secret = ephemeralasnull(var.my_ephemeral_var) != null

  # Sanitizes a map containing ephemeral values
  safe_config = ephemeralasnull({
    api_key = var.api_key # ephemeral
    region  = "us-east-1"
  })
}
```

## Practical Patterns

### Ephemeral Locals
Locals automatically become ephemeral if they reference an ephemeral source.
```hcl
locals {
  creds = jsondecode(ephemeral.aws_secretsmanager_secret_version.db.secret_string)
  url   = "postgres://${local.creds.user}:${local.creds.pass}@host/db"
}
```

### Validation with Ephemeral Values
You can use ephemeral values in `validation` blocks within variables.
```hcl
variable "token" {
  type      = string
  ephemeral = true
  validation {
    condition     = length(var.token) > 20
    error_message = "Token appears too short."
  }
}
```

## Summary Table: Sensitive vs. Ephemeral

| Feature | Sensitive | Ephemeral |
|---------|-----------|-----------|
| **UI Visibility** | Masked (***) | Masked (***) |
| **State Storage** | Plaintext in State | **Never in State** |
| **Plan Storage** | Plaintext in Plan | **Never in Plan** |
| **Usage** | Anywhere | Restricted Sinks Only |
| **Lifecycle** | Persists | Execution-only |

<!--
Source references:
- https://opentofu.org/docs/language/ephemerality/
- https://opentofu.org/docs/language/ephemerality/ephemeral-resources/
- https://opentofu.org/docs/language/ephemerality/write-only-attributes/
- https://opentofu.org/docs/language/functions/ephemeralasnull/
-->
