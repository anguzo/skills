---
name: opentofu-ci-automation
description: Non-interactive workflows, plan file patterns, JSON machine-readable output, and CI/CD automation best practices
---

# CI/CD Automation with OpenTofu

OpenTofu is designed for automation. Use these patterns to ensure predictable, non-interactive infrastructure management in CI/CD pipelines.

## Non-Interactive Mode

Always disable interactive prompts in automation to prevent pipelines from hanging.

```bash
# Disable all interactive prompts and auto-approve changes
tofu apply -auto-approve -input=false

# Signal automation mode to adjust output (removes "help" hints)
export TF_IN_AUTOMATION=1

# Disable color and progress markers for cleaner log parsing
tofu plan -no-color -concise
```

## Plan File Workflow

The standard CI/CD pattern involves creating a plan artifact, reviewing it, and then applying that exact artifact.

```bash
# 1. Initialize (non-interactive)
tofu init -input=false

# 2. Generate and save plan
# Use -detailed-exitcode for CI decision logic
tofu plan -out=tfplan -input=false -detailed-exitcode

# 3. Apply the saved plan
# No approval needed since the plan file is explicitly provided
tofu apply tfplan
```

### Exit Codes
Using `tofu plan -detailed-exitcode` allows your CI script to decide whether to proceed:
- **0**: Succeeded, no changes.
- **1**: Error.
- **2**: Succeeded, changes present.

## Machine-Readable JSON Output

OpenTofu provides structured JSON for parsing plan results or streaming UI events.

```bash
# Stream UI events as JSON (one object per line)
tofu plan -json

# Save JSON output to file while keeping human-readable logs in terminal
tofu plan -json-into=plan-output.json

# Convert a saved plan file to JSON for analysis
tofu show -json tfplan

# Get output values in JSON format
tofu output -json
```

## Environment Variables

Use environment variables to inject configuration without modifying code or command line arguments.

```bash
# Input variables (prefixed with TF_VAR_)
export TF_VAR_region="us-east-1"
export TF_VAR_environment="production"

# Global CLI argument injection
export TF_CLI_ARGS_plan="-parallelism=30"
export TF_CLI_ARGS_apply="-parallelism=30"

# Automation control
export TF_IN_AUTOMATION=1
export TF_INPUT=0

# Logging configuration
export TF_LOG=INFO
export TF_LOG_PATH=/var/log/tofu.log
```

## State Locking

CI environments should handle state locks gracefully to avoid failures during concurrent runs.

```bash
# Wait up to 5 minutes for a lock to be released before failing
tofu plan -lock-timeout=5m

# Manual recovery if a CI job crashes while holding a lock
tofu force-unlock <LOCK_ID>
```

## Parallel Execution

Optimize performance for large configurations by increasing concurrent operations.

```bash
# Increase parallelism (default is 10)
tofu apply -parallelism=50
```

## Workspace-Based Environments

Manage multiple environments (e.g., staging vs production) using workspaces and variable files.

```bash
# Select or create a workspace
tofu workspace select production || tofu workspace new production

# Run plan with environment-specific variables
tofu plan -var-file=environments/production.tfvars -out=tfplan
```

## GitHub Actions Example

A typical workflow using the official OpenTofu setup action.

```yaml
jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: opentofu/setup-opentofu@v1
        with:
          tofu_version: "1.11.0"
      - name: Initialize
        run: tofu init -input=false
      - name: Plan
        run: tofu plan -out=tfplan -input=false -detailed-exitcode
        continue-on-error: true
        id: plan
      - name: Apply
        run: tofu apply tfplan
        if: steps.plan.outcome == 'success' && steps.plan.outputs.exitcode == '2'
```

<!--
Source references:
- https://opentofu.org/docs/cli/commands/plan
- https://opentofu.org/docs/cli/commands/apply
- https://opentofu.org/docs/internals/machine-readable-ui
-->
