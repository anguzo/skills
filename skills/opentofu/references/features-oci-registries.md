---
name: opentofu-oci-registries
description: OCI Distribution registry support for module sources and provider mirrors in OpenTofu
---

# OCI Registry Integrations

OpenTofu supports OCI Distribution v1.1.0 registries for distributing modules and mirroring providers. This allows teams to use existing container registry infrastructure (e.g., GHCR, ECR, GAR, Harbor) to host OpenTofu artifacts.

## OCI Module Sources

Modules can be sourced directly from OCI repositories using the `oci://` scheme.

```hcl
module "vpc" {
  source  = "oci://registry.example.com/modules/vpc"
  version = "1.2.0"
}
```

### Key Details
- **Address Format**: `oci://<registry>/<repository>`
- **Versioning**: Normal OpenTofu version constraints apply. If no tag or digest is specified, OpenTofu defaults to the `latest` tag.
- **Sub-directories**: Standard sub-directory syntax works: `oci://registry.example.com/repo//modules/sub-mod`.

## OCI Registry Credentials

OpenTofu uses a centralized mechanism to discover and manage credentials for OCI registries.

### Implicit Discovery
By default, OpenTofu searches for credentials in standard "Docker-style" configuration files:
- `~/.docker/config.json`
- `~/.dockercfg`
- `$XDG_RUNTIME_DIR/containers/auth.json` (Linux)
- `~/.config/containers/auth.json` (macOS/Windows)

You can populate these by running `docker login`, `podman login`, or `oras login`.

### Explicit Configuration
You can define credentials directly in the OpenTofu CLI configuration file (`~/.tofurc` or `terraform.rc`):

```hcl
oci_credentials "registry.example.com" {
  username = "your-username"
  password = "your-password"
}
```

Other supported options include `access_token` and `refresh_token` for OAuth, or `docker_credentials_helper` (e.g., `docker_credentials_helper = "osxkeychain"`).

## OCI Provider Mirrors

OpenTofu can retrieve providers from an OCI registry instead of the primary provider registry. This is configured in the `provider_installation` block.

```hcl
provider_installation {
  oci_mirror {
    # ${namespace} and ${type} are dynamically interpolated
    repository_template = "registry.example.com/providers/${namespace}/${type}"
    include             = ["registry.opentofu.org/*/*"]
  }
  direct {
    exclude = ["registry.opentofu.org/*/*"]
  }
}
```

### OCI Provider Mirror Format
- **Index Manifest**: Each version tag (e.g., `1.0.0`) must refer to an OCI Image Index.
- **Artifact Type**: The index must have `artifactType: application/vnd.opentofu.provider`.
- **Platform Manifests**: The index contains descriptors for each platform (OS/Arch) with `artifactType: application/vnd.opentofu.provider-target`.
- **Payload**: The platform manifest contains a single zip layer (`archive/zip`) with the provider binary.

## Publishing Modules to OCI

Use the ORAS CLI to package and push modules to a registry.

### 1. Create a Zip Archive
```bash
zip -r module.zip . -x '.git/*' -x '.terraform/*'
```

### 2. Push to Registry
```bash
oras push registry.example.com/modules/vpc:1.2.0 \
  --artifact-type "application/vnd.opentofu.modulepkg" \
  module.zip:archive/zip
```

### Module Package Format
- **Manifest**: Must be a standard OCI Image Manifest.
- **Artifact Type**: `application/vnd.opentofu.modulepkg`.
- **Layer**: Exactly one layer with `mediaType: archive/zip` containing the module source.

<!--
Source references:
- https://opentofu.org/docs/cli/oci_registries/
- https://opentofu.org/docs/cli/oci_registries/credentials/
- https://opentofu.org/docs/cli/oci_registries/module-package/
- https://opentofu.org/docs/cli/oci_registries/provider-mirror/
-->
