---
name: opentofu-configuration
description: OpenTofu settings block, provider requirements, provider installation, and backend configuration syntax
---

# OpenTofu Core Configuration

The `terraform {}` block (named for compatibility) configures module-wide settings, including the required OpenTofu version, provider requirements, and backend storage.

## The `terraform {}` Block

Configure the engine and its dependencies.

```hcl
terraform {
  required_version = ">= 1.8"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    custom = {
      source  = "tofu.example.com/corp/custom"
      version = ">= 1.0.0"
    }
  }

  backend "s3" {
    bucket = "my-tofu-state"
    key    = "prod/network.tfstate"
    region = "us-east-1"
  }
}
```

## Provider Requirements

Declare providers to allow OpenTofu to download and manage them.

- **Local Name**: The key in `required_providers` (e.g., `aws`). Used throughout the module.
- **Source Address**: Global identifier in `[HOSTNAME/][NAMESPACE/]TYPE` format.
- **Version Constraints**: SemVer constraints (e.g., `~> 5.0`, `>= 1.0.0`).

### Multiple Provider Configurations (Aliases)

Use `alias` to manage multiple instances of a provider (e.g., different regions).

```hcl
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      configuration_aliases = [ aws.west ]
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

resource "aws_instance" "app" {
  provider = aws.west
  # ...
}
```

## Backend Configuration

Defines where state is stored. Only one backend block is allowed.

- **Direct Configuration**: Defined within the `backend` block.
- **Partial Configuration**: Omit arguments and provide them during `tofu init`.

```bash
# Partial config via file
tofu init -backend-config=path/to/backend.tfbackend

# Partial config via CLI flags
tofu init -backend-config="bucket=my-state" -backend-config="key=prod.tfstate"
```

### Cloud Block
The `cloud {}` block configures OpenTofu to use a managed service for state and runs.

```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "my-app-prod"
    }
  }
}
```

## Provider Installation (CLI Config)

Configure how OpenTofu fetches providers in `.tofurc` or `tofu.rc`.

```hcl
provider_installation {
  # Use an OCI mirror for specific providers
  oci_mirror {
    url = "https://registry.example.com/"
    include = ["registry.opentofu.org/hashicorp/*"]
  }

  # Use a network mirror
  network_mirror {
    url = "https://mirror.example.com/providers/"
  }

  # Direct installation for everything else, excluding mirrored providers
  direct {
    exclude = ["registry.opentofu.org/hashicorp/*"]
  }
}
```

### Plugin Caching
Enable global caching to avoid redundant downloads.

```hcl
plugin_cache_dir = "$HOME/.terraform.d/plugin-cache"
```

## Language Block (v1.12+)

OpenTofu v1.12 introduced the `language {}` block for explicit compatibility and edition settings.

```hcl
language {
  compatible_with {
    opentofu = ">= 1.12"
  }
  # Future-proofing arguments
  # edition = "tofu2024"
  # experiments = []
}
```

<!--
Source references:
- https://opentofu.org/docs/language/settings/
- https://opentofu.org/docs/language/providers/requirements/
- https://opentofu.org/docs/language/providers/configuration/
- https://opentofu.org/docs/cli/config/config-file/
-->
