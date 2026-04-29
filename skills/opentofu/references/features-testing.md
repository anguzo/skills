---
name: opentofu-testing
description: OpenTofu test framework with run blocks, assertions, mock providers, resource overrides, and continuous validation checks
---

# OpenTofu Testing Framework

The OpenTofu testing framework allows for integration and unit testing of modules without requiring external scripts. It supports both real infrastructure testing and plan-only (mocked) testing.

## Command: `tofu test`

The `tofu test` command executes test files and evaluates assertions. By default, it looks for files matching `*.tftest.hcl`, `*.tofutest.hcl`, `*.tftest.json`, or `*.tofutest.json`.

### Precedence
When both `.tftest.hcl` and `.tofutest.hcl` files exist with the same base name, OpenTofu prioritizes `.tofutest.hcl` and ignores the other. This allows for OpenTofu-specific tests in cross-compatible modules.

### Options
- `-test-directory=path`: Sets the directory to search for tests (default: `tests`).
- `-filter=path/to/file.tftest.hcl`: Runs only specific test files.
- `-var 'key=value'`: Sets a root module variable.
- `-var-file=filename`: Loads variables from a file.
- `-json`: Outputs results in JSON format.
- `-verbose`: Prints the plan or state for each run block during execution.

## Directory Layouts

### Flat Layout
Place test files directly alongside the module source.
```
├── main.tf
├── variables.tf
├── outputs.tf
└── main.tftest.hcl
```

### Nested Layout
Place test files in a dedicated `tests/` directory.
```
├── main.tf
├── variables.tf
└── tests/
    ├── setup.tftest.hcl
    └── integration.tftest.hcl
```

## Test File Structure

A `.tofutest.hcl` file consists of global `variables` and `provider` configurations, followed by one or more `run` blocks.

```hcl
# Global variables for all tests in this file
variables {
  instance_type = "t3.micro"
  environment   = "test"
}

# Provider configuration for tests
provider "aws" {
  region = "us-west-2"
}

# A single test case
run "creates_vpc" {
  command = apply  # Default: apply. Creates real infra.

  variables {
    vpc_cidr = "10.0.0.0/16"
  }

  assert {
    condition     = aws_vpc.main.cidr_block == "10.0.0.0/16"
    error_message = "VPC CIDR does not match expected value"
  }

  assert {
    condition     = aws_vpc.main.enable_dns_hostnames == true
    error_message = "DNS hostnames should be enabled"
  }
}
```

## Plan-only Testing

Use `command = plan` to validate logic and configuration without provisioning real infrastructure. This is faster and avoids cloud costs.

```hcl
run "validates_plan" {
  command = plan

  assert {
    condition     = aws_instance.web.instance_type == "t3.micro"
    error_message = "Wrong instance type in plan"
  }
}
```

## Mocking and Overrides

Mocking allows for testing without real providers or specific resources.

### `mock_provider`
Replaces a provider with a mocked version. OpenTofu generates dummy values for computed attributes.

```hcl
mock_provider "aws" {
  mock_resource "aws_s3_bucket" {
    defaults = {
      arn = "arn:aws:s3:::mocked-bucket"
    }
  }
  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "123456789012"
    }
  }
}
```

### `override_resource` and `override_data`
Skips the real provider for specific addresses and provides custom values.

```hcl
override_resource {
  target = aws_instance.web
  values = {
    id        = "i-mocked123"
    public_ip = "1.2.3.4"
  }
}
```

### `override_module`
Mocks an entire module call, returning specified outputs instead of executing the module logic.

```hcl
override_module {
  target = module.vpc
  outputs = {
    vpc_id     = "vpc-mocked123"
    subnet_ids = ["subnet-a", "subnet-b"]
  }
}
```

## Advanced Testing Patterns

### Validation Testing (`expect_failures`)
Verify that invalid inputs correctly trigger validation rules or preconditions.

```hcl
run "rejects_invalid_cidr" {
  command = plan
  variables {
    vpc_cidr = "invalid"
  }
  expect_failures = [
    var.vpc_cidr, # Matches the variable address with validation rule
  ]
}
```

### Test Harnesses (`run.module`)
Override the root module with a helper module (harness) to perform complex setup or use additional data sources.

```hcl
run "integration_test" {
  module {
    source = "./testing/harness"
  }

  assert {
    condition     = data.http.health.status_code == 200
    error_message = "Service health check failed"
  }
}
```

### Variable Precedence
Values are evaluated in this order (last one wins):
1. Environment variables (`TF_VAR_name`)
2. `terraform.tfvars` and `*.auto.tfvars` (root directory)
3. `tests/terraform.tfvars` and `tests/*.auto.tfvars`
4. CLI flags (`-var` and `-var-file`)
5. File-level `variables` block in `.tftest.hcl`
6. `run`-level `variables` block

## Continuous Validation (`check` blocks)

Unlike `run` blocks which are for testing, `check` blocks are part of the main configuration for ongoing monitoring.

```hcl
check "health_check" {
  # Scoped data source: only accessible within this check block
  data "http" "api" {
    url = "https://${aws_lb.main.dns_name}/health"
  }

  assert {
    condition     = data.http.api.status_code == 200
    error_message = "API health check failed with status ${data.http.api.status_code}"
  }
}
```

### Key Characteristics
- **Non-blocking**: Failed assertions produce warnings but do not halt plans or applies.
- **Continuous**: Executed during every plan and apply operation.
- **Scoped Data**: Data sources inside a `check` block are private to that block. If they fail, they produce warnings instead of errors.

<!--
Source references:
- https://opentofu.org/docs/cli/commands/test/
- https://opentofu.org/docs/language/checks/
-->
