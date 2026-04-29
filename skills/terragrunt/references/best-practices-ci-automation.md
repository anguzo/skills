---
name: terragrunt-ci-automation
description: Terragrunt CI/CD — non-interactive mode, run --all patterns, parallelism tuning, error handling, OpenTelemetry, debugging, SSH in pipelines
---

# Terragrunt CI/CD & Automation

Patterns for running Terragrunt in CI/CD pipelines and automated environments.

## Non-Interactive Mode

Always use in CI — prevents interactive prompts that would hang:

```bash
terragrunt run --all --non-interactive -- apply
# Or via environment variable
TG_NON_INTERACTIVE=true terragrunt run --all -- apply
```

`run --all apply/destroy` adds `-auto-approve` automatically (shared stdin limitation). Use `--no-auto-approve` to override in situations where you want to fail instead of auto-approving.

## CI Pipeline Patterns

### Plan all, apply targeted

```bash
# PR: Plan everything, report drift
terragrunt run --all --queue-ignore-errors -- plan

# Merge: Apply only changed units
terragrunt run --all --filter 'git(main)' -- apply
```

### Git-based targeting

```bash
# Units changed in this PR vs main branch
terragrunt run --all --filter 'git(main)' -- plan

# Include transitive dependents (units affected by changes)
terragrunt run --all --filter 'git(main)...' -- plan
```

### Dry-run verification before apply

```bash
# 1. Verify targeting
terragrunt list --filter './prod/**' --long --as apply

# 2. Plan
terragrunt run --all --filter './prod/**' -- plan

# 3. Apply
terragrunt run --all --filter './prod/**' -- apply
```

## Parallelism Tuning

```bash
# Default: Terragrunt determines based on available resources
terragrunt run --all -- plan

# Explicit parallelism
terragrunt run --all --parallelism 10 -- plan

# Ignore DAG for commands that don't need ordering (faster)
terragrunt run --all --queue-ignore-dag-order -- validate
terragrunt run --all --queue-ignore-dag-order -- plan  # Safe if no dependency outputs needed
```

**Guidelines:**
- `validate`: safe to ignore DAG order — no state access
- `plan`: safe to ignore DAG if `mock_outputs` are configured for all dependencies
- `apply`/`destroy`: NEVER ignore DAG order — ordering is critical
- CI runners: set parallelism based on available CPU/memory, not just unit count

## Error Handling

```bash
# Continue on failure — collect all errors at the end
terragrunt run --all --queue-ignore-errors -- plan

# Fail fast — stop immediately on first error
terragrunt run --all --fail-fast -- apply
```

**CI recommendations:**
- Use `--queue-ignore-errors` for `plan` (see all issues at once)
- Use `--fail-fast` for `apply` (don't propagate errors through dependency chain)
- Check exit codes: non-zero = at least one unit failed

## SSH Authentication in Pipelines

Register Git SSH hosts before running Terragrunt (prevents interactive prompt):

```bash
# GitHub
ssh -T -oStrictHostKeyChecking=accept-new git@github.com || true

# Then run Terragrunt
terragrunt run --all -- apply
```

For HTTPS-based module sources, set Git credentials:

```bash
git config --global url."https://oauth2:${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"
```

## Provider Caching in CI

Avoid re-downloading providers on every run:

```bash
# OpenTofu >= 1.10: Auto-configured, just persist the cache dir between runs
# Cache location: $HOME/.terragrunt-cache/providers

# Older versions: Use provider cache server
terragrunt run --all --provider-cache -- apply

# Custom cache dir (e.g., CI cache mount)
TG_PROVIDER_CACHE_DIR=/ci-cache/providers terragrunt run --all -- apply
```

**CI cache tip:** Persist `$HOME/.terragrunt-cache/providers` (or custom dir) between pipeline runs.

## OpenTelemetry Integration

Emit traces and metrics for CI observability:

### Traces (for performance analysis)

```bash
# Export to Jaeger/OTLP collector
export TG_TELEMETRY_TRACE_EXPORTER=otlpHttp
export OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318

# Or export to console (JSON)
export TG_TELEMETRY_TRACE_EXPORTER=console

# Propagate parent trace from CI pipeline
export TRACEPARENT="00-<trace_id>-<span_id>-01"

terragrunt run --all -- apply
```

### Metrics

```bash
export TG_TELEMETRY_METRIC_EXPORTER=grpcHttp
export OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4317
export TG_TELEMETRY_METRIC_EXPORTER_INSECURE_ENDPOINT=true
```

### Supported exporters

| Type | Traces | Metrics |
|------|--------|---------|
| None (default) | `none` | `none` |
| Console (JSON) | `console` | `console` |
| OTLP HTTP | `otlpHttp` | `otlpHttp` |
| OTLP gRPC | `otlpGrpc` | `grpcHttp` |
| Custom HTTP | `http` + `TG_TELEMETRY_TRACE_EXPORTER_HTTP_ENDPOINT` | — |

## Debugging CI Failures

```bash
# Increase log verbosity
terragrunt run --all --log-level debug -- plan

# JSON logs for structured parsing
terragrunt run --all --log-format json -- plan

# Generate debug tfvars to reproduce locally
terragrunt run --log-level debug --inputs-debug -- plan
# Produces terragrunt-debug.tfvars.json with resolved inputs

# Increase OpenTofu/Terraform verbosity
TF_LOG=debug terragrunt run -- plan
```

### inputs-debug workflow

When a plan produces unexpected results:

```bash
terragrunt run --log-level debug --inputs-debug -- plan
# Check terragrunt-debug.tfvars.json for resolved variable values
# Run tofu directly to isolate Terragrunt vs OpenTofu/Terraform issues:
tofu plan -var-file="terragrunt-debug.tfvars.json" .
```

## Logging Configuration

| Flag / Env | Description |
|------------|-------------|
| `--log-level LEVEL` / `TG_LOG_LEVEL` | trace, debug, info (default), warn, error |
| `--log-format FORMAT` | text (default), json, key-value |
| `--log-disable` | Suppress all Terragrunt output |
| `--no-color` | Disable ANSI colors (auto-detected in non-TTY) |

## IAM / OIDC in CI

```hcl
# terragrunt.hcl — OIDC for GitHub Actions (no static credentials)
iam_role               = "arn:aws:iam::123456789012:role/github-deploy"
iam_web_identity_token = get_env("ACTIONS_ID_TOKEN_REQUEST_TOKEN")
```

```bash
# Or via CLI/env
terragrunt run --all --iam-assume-role "arn:aws:iam::123456789012:role/deploy" -- apply
# TG_IAM_ASSUME_ROLE="arn:aws:iam::123456789012:role/deploy"
```

<!--
Source references:
- sources/terragrunt/docs/src/content/docs/06-troubleshooting/01-debugging.mdx
- sources/terragrunt/docs/src/content/docs/06-troubleshooting/02-open-telemetry.md
- sources/terragrunt/docs/src/content/docs/06-troubleshooting/03-performance.mdx
- sources/terragrunt/docs/src/content/docs/04-reference/02-cli/98-global-flags.mdx
- sources/terragrunt/docs/src/content/docs/03-features/01-units/05-authentication.mdx
-->
