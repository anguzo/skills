---
name: opentofu-state-encryption
description: State and plan encryption at rest using PBKDF2, AWS KMS, GCP KMS, Azure Key Vault, and OpenBao key providers
---

# OpenTofu State and Plan Encryption

OpenTofu supports native encryption of state and plan files at rest. This feature protects sensitive data (like access keys or passwords) from unauthorized access if the state file is leaked or stolen.

## Configuration Structure

Encryption is configured within the `terraform` block or via the `TF_ENCRYPTION` environment variable. The configuration consists of three parts: key providers, encryption methods, and the targets (state/plan/remote state).

### HCL Configuration

```hcl
terraform {
  encryption {
    key_provider "pbkdf2" "my_passphrase" {
      passphrase = var.encryption_passphrase
    }

    method "aes_gcm" "my_method" {
      keys = key_provider.pbkdf2.my_passphrase
    }

    state {
      method = method.aes_gcm.my_method
    }

    plan {
      method = method.aes_gcm.my_method
    }
  }
}
```

### Environment Variable Configuration

The `TF_ENCRYPTION` variable accepts the same configuration in HCL or JSON format. Environment settings override code-based settings.

```bash
export TF_ENCRYPTION='
key_provider "pbkdf2" "env_key" {
  passphrase = "your-secure-passphrase"
}
method "aes_gcm" "env_method" {
  keys = key_provider.pbkdf2.env_key
}
state {
  method = method.aes_gcm.env_method
}'
```

## Key Providers

Key providers generate the keys used by encryption methods.

### PBKDF2
Passphrase-based key derivation. Useful for local development or when a KMS is not available.

```hcl
key_provider "pbkdf2" "main" {
  passphrase    = var.encryption_passphrase # Min 16 chars
  key_length    = 32
  iterations    = 600000
  hash_function = "sha512"
  salt_length   = 32
}
```

### AWS KMS
Uses AWS Key Management Service.

```hcl
key_provider "aws_kms" "main" {
  kms_key_id = "alias/my-key"
  key_spec   = "AES_256"
  region     = "us-east-1"
}
```

### GCP KMS
Uses Google Cloud Key Management Service.

```hcl
key_provider "gcp_kms" "main" {
  kms_encryption_key = "projects/my-project/locations/global/keyRings/my-ring/cryptoKeys/my-key"
  key_length         = 32
}
```

### Azure Key Vault
Supports both asymmetric (RSA) and symmetric keys (Managed HSM).

**Asymmetric (RSA):**
```hcl
key_provider "azure_vault" "asym" {
  vault_uri      = "https://my-vault.vault.azure.net"
  vault_key_name = "my-rsa-key"
}
```

**Symmetric (Managed HSM):**
```hcl
key_provider "azure_vault" "sym" {
  vault_uri          = "https://my-hsm.managedhsm.azure.net"
  vault_key_name     = "my-aes-key"
  symmetric          = true
  symmetric_key_size = 256
}
```

### OpenBao / HashiCorp Vault
Uses the Transit Secret Engine. Compatible with OpenBao and HashiCorp Vault v1.14.

```hcl
key_provider "openbao" "main" {
  address  = "https://vault.example.com:8200"
  token    = var.vault_token
  key_name = "opentofu-key"
}
```

### External (Experimental)
Executes an external program to retrieve keys.

```hcl
key_provider "external" "custom" {
  command = ["/usr/local/bin/get-key", "--env", "prod"]
}
```

## Encryption Methods

Methods define the algorithm used for encryption.

### AES-GCM
The primary supported method. Requires 16, 24, or 32-byte keys.

```hcl
method "aes_gcm" "standard" {
  keys = key_provider.aws_kms.main
}
```

**Key Saturation Risk:** AES-GCM usage limits (key saturation) should be managed via KMS key rotation or high iteration counts in PBKDF2.

### Unencrypted
Used exclusively for migration.

```hcl
method "unencrypted" "plain" {}
```

## Key Rollover and Migrations

OpenTofu uses `fallback` blocks to handle transitions between encryption configurations.

### Configuration Rollover
When changing keys or methods, provide the old configuration as a fallback. OpenTofu will attempt to read using the fallback but will always write using the primary method.

```hcl
terraform {
  encryption {
    method "aes_gcm" "new" { keys = key_provider.aws_kms.new }
    method "aes_gcm" "old" { keys = key_provider.pbkdf2.old }

    state {
      method = method.aes_gcm.new
      fallback {
        method = method.aes_gcm.old
      }
    }
  }
}
```

### Initial Setup (Migration to Encrypted)
To encrypt an existing unencrypted state:
1. Define your new encryption method.
2. Add a fallback to the `unencrypted` method.

```hcl
state {
  method = method.aes_gcm.secure
  fallback {
    method = method.unencrypted.plain
  }
}
```

### Rolling Back (Migration to Unencrypted)
To remove encryption:
1. Set the primary method to `unencrypted`.
2. Keep the existing encryption method as a fallback.

```hcl
state {
  method = method.unencrypted.plain
  fallback {
    method = method.aes_gcm.secure
  }
}
```

## Remote State Encryption

You can target specific `terraform_remote_state` data sources for decryption.

```hcl
terraform {
  encryption {
    # ... providers and methods ...

    remote_state_data_sources {
      # Target a specific data source
      data_source "my_remote_project" {
        method = method.aes_gcm.shared
      }
    }
  }
}
```

Targets can be:
- `data_source_name` (main project)
- `module.name.data_source_name`
- `module.name.data_source_name[0]`

## Renaming Providers with Metadata Alias

If you need to rename a key provider without breaking existing encrypted state, use `encrypted_metadata_alias`. This string is stored in the state metadata instead of the provider name.

```hcl
key_provider "pbkdf2" "new_name" {
  passphrase               = var.pass
  encrypted_metadata_alias = "static-metadata-key"
}
```

## Constraints and Best Practices

- **Variables/Locals:** Can be used in encryption configuration but cannot reference state data or provider-defined functions. They must be resolvable during `tofu init`.
- **Metadata Protection:** Encrypted data contains metadata about the key provider and method names. Avoid renaming them without using `fallback` or `encrypted_metadata_alias`.
- **Disaster Recovery:** Always backup your unencrypted state before enabling encryption and ensure your keys/passphrases are backed up.
- **Enforcement:** To prevent accidental unencrypted writes if environment variables are missing, use an empty encryption block to force a configuration check.

<!--
Source references:
- https://github.com/opentofu/opentofu/blob/main/website/docs/language/state/encryption.mdx
-->
