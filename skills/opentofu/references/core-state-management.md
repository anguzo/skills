---
name: opentofu-state-management
description: Backend configuration, state locking, remote state data source, and backend migration patterns
---

# State Management

OpenTofu uses state to map configuration to real-world resources and track metadata. This skill covers backend configuration, locking, and remote state sharing.

## Backend Configuration

Backends define where state snapshots are stored. Configure them within the `terraform` block.

### S3 (AWS)
Supports state locking via DynamoDB.
```hcl
terraform {
  backend "s3" {
    bucket         = "my-tofu-state"
    key            = "path/to/my/key"
    region         = "us-east-1"
    dynamodb_table = "tofu-state-lock"
    encrypt        = true
    tags = {
      Environment = "prod"
    }
  }
}
```

### GCS (Google Cloud)
Uses native object locking.
```hcl
terraform {
  backend "gcs" {
    bucket = "my-tofu-state"
    prefix = "terraform/state"
  }
}
```

### Azure (azurerm)
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "tstate-rg"
    storage_account_name = "tstateaccount"
    container_name       = "tstate"
    key                  = "terraform.tfstate"
  }
}
```

### HTTP
Generic RESTful backend.
```hcl
terraform {
  backend "http" {
    address        = "https://api.example.com/state"
    lock_address   = "https://api.example.com/lock"
    unlock_address = "https://api.example.com/unlock"
  }
}
```

### Consul
```hcl
terraform {
  backend "consul" {
    address = "demo.consul.io"
    scheme  = "https"
    path    = "tofu/state"
  }
}
```

### Local
Default behavior if no backend is specified.
```hcl
terraform {
  backend "local" {
    path = "relative/path/to/tofu.tfstate"
  }
}
```

### Postgres (pg)
```hcl
terraform {
  backend "pg" {
    conn_str    = "postgres://user:pass@host/db?sslmode=disable"
    schema_name = "tofu_state"
  }
}
```

## State Locking

Locking prevents concurrent writes to the same state file.

- **Automatic**: OpenTofu automatically acquires a lock during `plan`, `apply`, and `destroy`.
- **Failure**: If a lock is held by another process, OpenTofu exits with an error.
- **Force Unlock**: Use when a process dies without releasing the lock. Requires the `LOCK_ID` provided in the error message.
  ```bash
  tofu force-unlock <LOCK_ID>
  ```

### Locking Flags
- `-lock=false`: Disables locking (dangerous, only for emergencies).
- `-lock-timeout=<duration>`: Retries lock acquisition for the specified time (e.g., `5m`).

## Remote State Data Source

The `terraform_remote_state` data source allows reading root module outputs from another configuration's state.

```hcl
data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    bucket = "remote-state-bucket"
    key    = "vpc/terraform.tfstate"
    region = "us-east-1"
  }
}

# Accessing outputs
resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.vpc.outputs.public_subnet_id
}
```

### Key Considerations
- **Outputs Only**: Only root-level `output` blocks are accessible.
- **Read Access**: The user running OpenTofu must have read permissions for the remote state storage.
- **Security**: Accessing remote state gives visibility into the entire state file (including sensitive data), even though only outputs are exposed via the data source.

## Backend Migration

Use `tofu init` to change or reconfigure backends.

### Migration Patterns
- **Standard Migration**: Moves existing state to a new backend.
  ```bash
  tofu init -migrate-state
  ```
- **Reconfiguration**: Switches backend without attempting to copy state. Useful when the remote state is already populated.
  ```bash
  tofu init -reconfigure
  ```

### Partial Configuration
Omit sensitive fields from code and provide them via CLI or files:
```bash
tofu init -backend-config="access_key=..." -backend-config="secret_key=..."
# Or via file
tofu init -backend-config=backend.tfbackend
```

<!--
Source references:
- https://opentofu.org/docs/language/state/
- https://opentofu.org/docs/language/settings/backends/configuration/
- https://opentofu.org/docs/language/state/locking/
- https://opentofu.org/docs/language/state/remote-state-data/
-->
