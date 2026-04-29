---
name: opentofu-import
description: Configuration-driven import blocks for bringing existing infrastructure under OpenTofu management
---

# OpenTofu Configuration-Driven Import

OpenTofu's `import` block provides a declarative way to bring existing infrastructure under management. Unlike the legacy `tofu import` CLI command, this approach is predictable, reviewable in CI/CD, and supports execution plans.

## Basic Syntax

An `import` block requires a target resource address and the unique ID of the existing resource.

```hcl
import {
  to = aws_instance.web
  id = "i-1234567890abcdef0"
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  tags = {
    Name = "web-server"
  }
}
```

## Import Workflow

1.  **Define blocks**: Add an `import` block and a matching `resource` block (or use config generation).
2.  **Plan**: Run `tofu plan`. OpenTofu shows the resources it will import.
3.  **Apply**: Run `tofu apply`. OpenTofu imports the resources into the state file.
4.  **Persistence**: `import` blocks are idempotent. They can remain in the configuration as a record or be removed after the initial import.

## Bulk Operations with `for_each`

Use `for_each` within an `import` block to import multiple resources at once.

```hcl
import {
  for_each = var.existing_buckets
  to       = aws_s3_bucket.imported[each.key]
  id       = each.value
}

variable "existing_buckets" {
  type = map(string)
  default = {
    logs   = "company-logs-bucket"
    assets = "company-assets-bucket"
  }
}

resource "aws_s3_bucket" "imported" {
  for_each = var.existing_buckets
  bucket   = each.value
}
```

## Automatic Configuration Generation

If you don't want to write the `resource` blocks manually, OpenTofu can generate them for you.

```bash
# Generate resource configuration for imported resources
tofu plan -generate-config-out=generated_resources.tf
```

### Key Features of Generated Config
- **Templates**: OpenTofu creates a best-guess template for the resource configuration.
- **Manual Cleanup**: You should review and refine the generated code (e.g., replacing hardcoded values with variables).
- **Generated Hints**: Attributes that are sensitive or write-only are flagged with comments.
  ```hcl
  resource "aws_db_instance" "database" {
    password = null # sensitive
  }
  ```

## Advanced Scenarios

### Provider Aliasing
Specify a non-default provider for the import operation.

```hcl
import {
  provider = aws.west
  to       = aws_instance.web
  id       = "i-abcdef123"
}
```

### Module-Scoped Imports
Import resources directly into a module.

```hcl
import {
  to = module.vpc.aws_vpc.main
  id = "vpc-12345"
}
```

## Comparison: Import Block vs. CLI Command

| Feature | `import` Block | `tofu import` CLI |
|---------|----------------|-------------------|
| **Nature** | Declarative (Config) | Imperative (Command) |
| **Workflow** | Plan then Apply | Immediate State Change |
| **CI/CD** | Fully compatible | Hard to automate safely |
| **Visibility** | Part of code review | Hidden in terminal history |
| **Idempotency** | Yes | No (errors if already in state) |

<!--
Source references:
- https://opentofu.org/docs/language/import/
- https://opentofu.org/docs/language/import/generating-configuration/
-->
