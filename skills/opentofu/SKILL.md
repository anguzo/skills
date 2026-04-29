---
name: opentofu
description: OpenTofu CLI, HCL configuration, state encryption, ephemerality, testing, OCI registries, and import workflows. Use when writing or reviewing OpenTofu/Terraform configurations, managing state, running tofu commands, or automating infrastructure deployments.
metadata:
  author: anguzo
  version: "2026.4.29"
  source: Generated from https://github.com/opentofu/opentofu, scripts located at https://github.com/anguzo/skills
---

OpenTofu is an open-source infrastructure-as-code tool (Terraform fork) for building, changing, and versioning infrastructure safely. It uses HCL configuration, supports state encryption at rest, ephemeral resources that never persist in state, native testing with mocking, and OCI registries for module/provider distribution.

**Important:** OpenTofu is command-compatible with Terraform. The CLI binary is `tofu` (not `terraform`). Configuration files use `.tf`/`.tofu` extensions. The `terraform {}` block name is retained for compatibility. State files are compatible between OpenTofu and Terraform (same format). OpenTofu-specific features (encryption, ephemerality, OCI) are not backwards-compatible with Terraform.

> The skill is based on OpenTofu v1.11, generated at 2026-04-29.

## Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| CLI Commands | plan, apply, init, destroy, fmt, validate, import, state, test, console | [core-cli](references/core-cli.md) |
| Configuration | terraform block, required_providers, provider_installation, backend config | [core-configuration](references/core-configuration.md) |
| State Management | Backends (S3, GCS, Azure, HTTP, Consul), locking, remote state, migration | [core-state-management](references/core-state-management.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|-----------|
| State Encryption | Encrypt state/plan at rest with PBKDF2, AWS KMS, GCP KMS, Azure Vault, OpenBao | [features-state-encryption](references/features-state-encryption.md) |
| Ephemerality | Ephemeral resources, variables, outputs, write-only attributes — never in state | [features-ephemerality](references/features-ephemerality.md) |
| Enabled & Lifecycle | enabled meta-argument (v1.11), lifecycle block, preconditions, postconditions | [features-enabled-lifecycle](references/features-enabled-lifecycle.md) |
| Testing | tofu test with run blocks, assertions, mocking, overrides, offline testing | [features-testing](references/features-testing.md) |
| Import | Configuration-driven import blocks, for_each import, config generation | [features-import](references/features-import.md) |
| OCI Registries | OCI Distribution for modules and provider mirrors, credential config, publishing | [features-oci-registries](references/features-oci-registries.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|-----------|
| Terraform Migration | Migrating from Terraform, binary swap, state compatibility, feature parity | [best-practices-migration](references/best-practices-migration.md) |
| State Operations | state mv/rm/replace-provider, refactoring, state recovery, removed blocks | [best-practices-state-operations](references/best-practices-state-operations.md) |
| CI/CD Automation | Non-interactive workflows, plan files, JSON output, locking, exit codes | [best-practices-ci-automation](references/best-practices-ci-automation.md) |
