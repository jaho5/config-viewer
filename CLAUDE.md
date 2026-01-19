# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev --host     # Start dev server (accessible on network)
bun run build          # Production build
bun run check          # Type check with svelte-check
```

## Architecture

Config Viewer is a Svelte 5 app for viewing/editing YAML configs with embedded documentation.

### Core Flow

1. **Parser** (`src/lib/parser.ts`) - Converts documented YAML text into a `ConfigNode[]` tree
   - Extracts `@doc`, `@options`, `@default`, `@why`, `@warn`, `@multi` tags from comments
   - Comments before a field become its metadata
   - Two-pass: tokenize lines → build tree with comment attachment

2. **Store** (`src/lib/store.svelte.ts`) - Reactive state using Svelte 5 `$state` rune
   - Holds the config tree, provides path-based node access (`root.0.1` = second child of first node)
   - Exposes: `toggleExpand`, `toggleDocs`, `setValue`, `expandAll`, `collapseAll`, etc.

3. **Node Component** (`src/lib/components/Node.svelte`) - Recursive tree renderer
   - Self-imports for recursion (Svelte 5 pattern)
   - Handles: expand/collapse, inline value editing, option selection, docs toggle
   - Options: `|` separated, placeholders like `<hostname>` rendered as plain text
   - Multi-select uses `@multi: true` tag with `[value1, value2]` array format

### Documented YAML Format

See `docs/CONFIG_FORMAT.md` for full spec. Key tags:
- `@doc` - Description
- `@options` - Choices separated by `|`
- `@default` - Default value
- `@why` - Multi-line explanation per option
- `@warn` - Warning (red)
- `@multi: true` - Array field

Sample configs in `samples/` directory.
