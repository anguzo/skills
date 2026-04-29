---
name: opentofu-migration
description: Migrating from Terraform to OpenTofu including binary replacement, state compatibility, and feature differences
---

# OpenTofu Migration Guide

OpenTofu is an open source fork of Terraform (MPL-2.0). Migrating is primarily a binary replacement because OpenTofu maintains high compatibility with Terraform state and configuration.

## Migration Process

The transition is designed to be a "drop-in" replacement for most users.

1. **Back up state**: Always back up your `terraform.tfstate` or remote state bucket before migrating.
2. **Install OpenTofu**: Install the `tofu` binary on your system or CI runner.
3. **Reinitialize**: Run `tofu init` in your project directory. This downloads providers from `registry.opentofu.org` and configures the backend.
4. **Verify**: Run `tofu plan`. You should see "No changes" or the same output as Terraform.
5. **Apply**: Run `tofu apply` to finalize the migration and update the state metadata.

## File Naming and Precedence

OpenTofu supports both existing Terraform extensions and its own specific extensions.

| File Type | Terraform Extension | OpenTofu Extension | Precedence |
|-----------|--------------------|-------------------|------------|
| Configuration | `.tf`, `.tf.json` | `.tofu`, `.tofu.json` | `.tofu` takes precedence over `.tf` |
| Variable Definitions | `.tfvars` | `.tofuvars` | `.tofuvars` takes precedence |
| Test Files | `.tftest.hcl` | `.tofutest.hcl` | `.tofutest.hcl` takes precedence |

## State and Initialization Compatibility

OpenTofu works directly with your existing Terraform workspace.

- **State Format**: OpenTofu reads and writes the same state format as Terraform. No explicit conversion is required.
- **Dependency Lock**: `.terraform.lock.hcl` is fully compatible and used by `tofu init`.
- **Working Directory**: OpenTofu uses `.terraform/` for compatibility but also supports `.opentofu/`.
- **Block Name**: The `terraform {}` configuration block name is preserved for compatibility. You do not need to rename it to `tofu {}`.

## Provider Registry

OpenTofu uses its own registry but maintains access to most common providers.

- **Default Registry**: `registry.opentofu.org` is the default. Most providers from the Terraform Registry are available here.
- **Custom Registries**: You can still use custom registries via `provider_installation` in the CLI config.
- **OCI Support**: OpenTofu supports OCI registries as a native source for modules and provider mirrors.

## Key Feature Differences

OpenTofu introduces several features not present in Terraform (BSL):

- **State Encryption**: Encrypt state and plan files at rest using PBKDF2, AWS KMS, GCP KMS, Azure Key Vault, or OpenBao.
- **Ephemeral Resources**: Use `ephemeral` resources and write-only attributes that exist only in memory and are never saved to state.
- **Enabled Meta-argument**: Use `lifecycle { enabled = bool }` in resources or modules as a cleaner alternative to `count` for toggling instances.
- **Enhanced Variables**: Use variables and locals directly in `source` and `version` fields of `module` blocks, and within `backend` configurations.
- **Refactoring**: Use the `removed` block with `lifecycle { destroy = false }` to remove resources or modules from state without destroying the underlying infrastructure.

## CI/CD Pipeline Migration

Migrating a pipeline is often as simple as updating the binary name.

```bash
# Before (Terraform)
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# After (OpenTofu)
tofu init
tofu plan -out=tfplan
tofu apply tfplan
```

## Considerations

- **TFC/TFE Features**: Some specific Terraform Cloud or Enterprise features (like certain VCS integrations or specific UI components) may not have direct equivalents in OpenTofu.
- **Provider Lag**: While most providers are mirrored, some highly specific or new HashiCorp-owned providers might experience small delays appearing on the OpenTofu registry.
- **License**: OpenTofu is licensed under MPL-2.0, providing a permissive open source alternative to the BSL.

<!--
Source references:
- https://opentofu.org/docs/intro/migration/migration-guide/
- https://opentofu.org/docs/intro/whats-new/
- https://opentofu.org/docs/language/state/encryption/
- https://opentofu.org/docs/language/meta-arguments/enabled/
- https://opentofu.org/docs/language/modules/syntax/
-->
