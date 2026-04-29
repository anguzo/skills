---
name: terragrunt-hcl-attributes
description: Terragrunt HCL top-level attributes — inputs, prevent_destroy, iam_role, download_dir, terraform_binary, version constraints
---

# Terragrunt HCL Attributes

Top-level attributes define values for Terragrunt configuration as a whole.

## inputs

Map of input variables passed to OpenTofu/Terraform via `TF_VAR_*` environment variables.

```hcl
inputs = {
  instance_type  = "t4g.micro"
  instance_count = 3
  tags = {
    Environment = "production"
    ManagedBy   = "terragrunt"
  }
}
```

Type information is JSON-encoded — you MUST define proper `type` constraints on Terraform variables for complex types (lists, maps, objects).

### Variable Precedence (lowest → highest)

1. `inputs` in `terragrunt.hcl`
2. `TF_VAR_*` environment variables
3. `terraform.tfvars` / `terraform.tfvars.json`
4. `*.auto.tfvars` / `*.auto.tfvars.json` (lexical order)
5. `-var` and `-var-file` CLI options

## prevent_destroy

Protects a unit from destruction.

```hcl
prevent_destroy = true
```

When `true`, `destroy` or `run --all destroy` will error instead of destroying resources. Use for critical infrastructure (databases, auth systems).

## iam_role

IAM role for Terragrunt to assume before invoking OpenTofu/Terraform.

```hcl
iam_role = "arn:aws:iam::${local.account_id}:role/terragrunt-deploy"
```

Precedence: `--iam-assume-role` CLI → `TG_IAM_ASSUME_ROLE` env → unit config → included config.

## iam_assume_role_duration

STS session duration in seconds.

```hcl
iam_assume_role_duration = 14400  # 4 hours
```

## iam_assume_role_session_name

STS session name for assumed role.

```hcl
iam_assume_role_session_name = "terragrunt-deploy"
```

## iam_web_identity_token

OIDC token value or file path for AssumeRoleWithWebIdentity (CI/CD without static credentials).

```hcl
iam_role               = "arn:aws:iam::123456789012:role/github-actions"
iam_web_identity_token = get_env("ACTIONS_ID_TOKEN_REQUEST_TOKEN")
```

Supports GitHub Actions, GitLab CI, CircleCI OIDC tokens.

## download_dir

Override where Terragrunt downloads remote module source code.

```hcl
download_dir = "/tmp/terragrunt-cache/${path_relative_from_include()}"
```

Precedence: `--download-dir` CLI → `TG_DOWNLOAD_DIR` env → unit config → included config.

## terraform_binary

Override the IaC binary Terragrunt invokes (default: `tofu`).

```hcl
terraform_binary = "terraform"
```

Precedence: `--tf-path` CLI → `TG_TF_PATH` env → unit config → included config.

## terraform_version_constraint

Enforce minimum OpenTofu/Terraform version.

```hcl
terraform_version_constraint = ">= 1.6.0"
```

## terragrunt_version_constraint

Enforce compatible Terragrunt CLI version.

```hcl
terragrunt_version_constraint = ">= 1.0.0"
```

If the running Terragrunt version doesn't match, it exits with an error immediately.

<!--
Source references:
- sources/terragrunt/docs/src/content/docs/04-reference/01-hcl/03-attributes.mdx
-->
