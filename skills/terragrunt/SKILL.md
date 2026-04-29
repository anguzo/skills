---
name: terragrunt
description: Terragrunt CLI, HCL configuration, units, stacks, dependency DAG, run queue, filtering, provider caching, and CI/CD workflows. Use when writing or reviewing Terragrunt configurations, orchestrating OpenTofu/Terraform at scale, managing state backends, or running multi-unit infrastructure deployments.
metadata:
  author: anguzo
  version: "2026.4.29"
  source: Generated from https://github.com/gruntwork-io/terragrunt, scripts located at https://github.com/anguzo/skills
---

Terragrunt is a flexible orchestration tool that allows Infrastructure as Code written in OpenTofu/Terraform to scale. It wraps `tofu`/`terraform` commands, adding DRY configuration, dependency management between units, automatic state backend provisioning, and parallel execution across infrastructure stacks.

**Key concepts:** A **unit** is a single `terragrunt.hcl` file representing one state-isolated piece of infrastructure. A **stack** is a collection of units managed together. Terragrunt resolves unit ordering via a **DAG** (Directed Acyclic Graph) built from `dependency` blocks. The **run queue** orchestrates parallel execution respecting DAG order.

**Important:** Terragrunt defaults to using OpenTofu (`tofu`) if both are available. The CLI binary is `terragrunt`. Configuration files use `.hcl` extension. Root config is typically `root.hcl`, unit configs are `terragrunt.hcl`, and stack blueprints are `terragrunt.stack.hcl`.

> The skill is based on Terragrunt v1.0.3, generated at 2026-04-29.

## Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| HCL Blocks | terraform, remote_state, include, dependency, dependencies, generate, feature, errors | [core-hcl-blocks](references/core-hcl-blocks.md) |
| HCL Attributes | inputs, prevent_destroy, iam_role, download_dir, terraform_binary, version constraints | [core-hcl-attributes](references/core-hcl-attributes.md) |
| HCL Functions | find_in_parent_folders, path_relative_to_include, run_cmd, read_terragrunt_config, sops, AWS helpers | [core-hcl-functions](references/core-hcl-functions.md) |
| CLI Commands | run, exec, find, list, scaffold, catalog, render, backend, stack, hcl fmt/validate, graph | [core-cli](references/core-cli.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|-----------|
| Units | Remote modules, includes, hooks, extra_arguments, auto-init, state backend, authentication | [features-units](references/features-units.md) |
| Stacks | Implicit/explicit stacks, terragrunt.stack.hcl, unit/stack blocks, run queue, DAG ordering | [features-stacks](references/features-stacks.md) |
| Filtering | --filter flag, path/name/attribute/graph/git expressions, combining filters, filters-file | [features-filter](references/features-filter.md) |
| Caching | Provider cache server, auto-provider-cache-dir, CAS (content-addressable storage) | [features-caching](references/features-caching.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|-----------|
| Project Structure | Directory layout, root.hcl patterns, multi-environment, mono-repo vs multi-repo | [best-practices-project-structure](references/best-practices-project-structure.md) |
| CI/CD Automation | Non-interactive mode, run --all, parallelism, error handling, plan files, OpenTelemetry | [best-practices-ci-automation](references/best-practices-ci-automation.md) |
