# Config Viewer

A Svelte 5 app for viewing and editing YAML configuration files with embedded documentation.

![Config Viewer](https://img.shields.io/badge/Svelte-5-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- **Self-documenting configs** - Parse YAML with `@doc`, `@options`, `@default`, `@why`, `@warn`, `@multi` tags
- **Tree view** - Expand/collapse nested config sections
- **Inline editing** - Click values to edit, click options to select
- **Multi-select support** - Array fields with `[value1, value2]` format
- **Export** - Copy modified config to clipboard
- **Load files** - Import YAML configs via file picker

## Documented YAML Format

```yaml
# server:
#   @doc: HTTP server settings
server:
  # host: localhost
  #   @options: localhost | 0.0.0.0 | <hostname>
  #   @default: localhost
  #   @doc: Bind address for the server
  #   @why:
  #     localhost — local only, secure default
  #     0.0.0.0   — all interfaces, for containers
  host: localhost
```

See [docs/CONFIG_FORMAT.md](docs/CONFIG_FORMAT.md) for the full specification.

## Getting Started

```bash
bun install
bun run dev --host
```

Open http://localhost:5173

## Sample Configs

Sample configuration files in `samples/`:
- `database.yaml` - Database connection settings
- `api.yaml` - API/web service configuration
- `deployment.yaml` - Infrastructure/deployment settings
