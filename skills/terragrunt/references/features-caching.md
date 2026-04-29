---
name: terragrunt-caching
description: Terragrunt caching — provider cache server, auto-provider-cache-dir, Content Addressable Store (CAS), performance optimization
---

# Terragrunt Caching

Terragrunt provides caching mechanisms to improve performance and reduce bandwidth when working with OpenTofu/Terraform at scale.

## Auto Provider Cache Dir (Default)

Enabled by default when using OpenTofu >= 1.10. Terragrunt sets `TF_PLUGIN_CACHE_DIR` to a shared directory so providers are downloaded once and reused.

```bash
# Just works — no configuration needed with OpenTofu >= 1.10
terragrunt run --all -- apply

# Override cache directory
terragrunt apply --provider-cache-dir /custom/path/to/cache
# Or: TG_PROVIDER_CACHE_DIR='/custom/path' terragrunt apply

# Disable for a specific run
terragrunt run --all -- apply --no-auto-provider-cache-dir
```

### Default cache locations

- Unix: `$HOME/.terragrunt-cache/providers`
- macOS: `$HOME/Library/Caches/terragrunt/providers`
- Windows: `%LocalAppData%\terragrunt\providers`

### Requirements

- OpenTofu >= 1.10 (handles concurrent access safely)
- Only works with OpenTofu (not Terraform)

## Provider Cache Server

For older OpenTofu/Terraform versions, or when auto-provider-cache-dir has lock contention at very large scale. Runs a local HTTP server that coordinates provider downloads across concurrent `init` processes.

```bash
# Enable with flag
terragrunt run --all --provider-cache -- apply

# Enable with environment variable
TG_PROVIDER_CACHE=1 terragrunt run --all -- apply
```

### How it works

1. Starts a localhost HTTP server acting as a private registry.
2. Configures each OpenTofu/Terraform instance to route provider requests through it.
3. First `init` triggers downloads; server stores providers in cache.
4. Returns HTTP 423 to OpenTofu/Terraform (prevents redundant downloads).
5. Second `init` finds all providers in cache — creates symlinks instantly.
6. Generates `.terraform.lock.hcl` from cached provider hashes.

### Configuration

```bash
terragrunt apply \
  --provider-cache \
  --provider-cache-dir /path/to/cache \
  --provider-cache-registry-names registry.terraform.io \
  --provider-cache-registry-names custom-registry.example.com

# Environment variables
TG_PROVIDER_CACHE=1
TG_PROVIDER_CACHE_DIR=/path/to/cache
TG_PROVIDER_CACHE_REGISTRY_NAMES=registry.terraform.io,custom-registry.example.com
TG_PROVIDER_CACHE_HOST=localhost
TG_PROVIDER_CACHE_PORT=5758
TG_PROVIDER_CACHE_TOKEN=my-secret
```

### When to use which

| Scenario | Solution |
|----------|----------|
| OpenTofu >= 1.10 | Auto Provider Cache Dir (default, zero config) |
| Terraform or older OpenTofu | Provider Cache Server |
| Large-scale with NFS/shared storage | Provider Cache Server |
| Very large scale lock contention | Provider Cache Server |
| Individual unit runs | Neither (overhead > benefit) |

### Important: Do NOT use `TF_PLUGIN_CACHE_DIR` manually

Setting `TF_PLUGIN_CACHE_DIR` yourself with `run --all` causes concurrent init conflicts. Let Terragrunt handle it via auto-provider-cache-dir or provider-cache-server.

## Content Addressable Store (CAS)

**Experimental** — deduplicates Git repository content across multiple units using hard links.

```bash
# Enable CAS experiment
terragrunt run --all --experiment cas -- apply

# Disable for a specific run even when experiment is enabled
terragrunt run --all --no-cas -- apply
```

### What CAS caches

- Catalog clones (from `catalog { urls = [...] }`)
- OpenTofu/Terraform source clones (from `terraform { source = "git::..." }`)
- Stack generation sources (from `unit { source = "..." }`)

### How it works

1. **Cold clone**: Resolves Git ref → clones to temp → extracts blobs/trees → stores in CAS → hard links to target.
2. **Warm clone**: Resolves Git ref → finds in CAS → hard links to target (no network).
3. Falls back to copies if hard linking fails (cross-filesystem).

### CAS with Stacks (v1.0.3+)

Use `update_source_with_cas = true` for relative paths in stack catalogs:

```hcl
# In catalog repository: stacks/my-stack/terragrunt.stack.hcl
unit "service" {
  source = "../..//units/my-service"
  update_source_with_cas = true
  path   = "service"
}
```

During `stack generate`, Terragrunt rewrites relative sources to deterministic `cas::` references. Generated `.terragrunt-stack` files won't produce diffs on regeneration.

### Storage location

`~/.cache/terragrunt/cas/` — can be safely deleted entirely (regenerated on demand). Avoid partial deletions.

## Performance Tips

### dependency-fetch-output-from-state experiment

Bypasses `tofu output -json` (which loads providers) by reading S3 state directly:

```bash
terragrunt run --all --experiment=dependency-fetch-output-from-state -- plan
```

**Limitations:**
- S3 backends only
- Not compatible with OpenTofu state encryption
- State schema not guaranteed stable across versions

### General performance guidance

- Use `--parallelism N` to tune concurrent unit executions
- Measure before optimizing: use OpenTelemetry traces or `hyperfine`
- Provider downloads are the biggest bandwidth cost — always use a cache mechanism
- For `run --all plan`: use `--queue-ignore-dag-order` when outputs aren't needed (skips serial init)

<!--
Source references:
- sources/terragrunt/docs/src/content/docs/03-features/07-caching/index.mdx
- sources/terragrunt/docs/src/content/docs/03-features/07-caching/02-provider-cache-server.mdx
- sources/terragrunt/docs/src/content/docs/03-features/07-caching/03-auto-provider-cache-dir.mdx
- sources/terragrunt/docs/src/content/docs/03-features/07-caching/04-cas.mdx
- sources/terragrunt/docs/src/content/docs/06-troubleshooting/03-performance.mdx
-->
