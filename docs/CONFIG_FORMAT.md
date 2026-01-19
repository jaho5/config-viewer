# Documented YAML Config Format

## Overview

This format extends standard YAML with structured documentation comments. Comments placed directly before a field become its documentation, making configs self-documenting. The config viewer parses these comments to display helpful tooltips, warnings, and option lists.

## Basic Structure

```yaml
# field_name: default_value
#   @tag: content
field_name: actual_value
```

The comment block immediately preceding a field contains:
- Line 1: The field name and its default value
- Subsequent lines: Tags that provide additional documentation

## Available Tags

### @doc
Description of the field's purpose.

```yaml
# max_connections: 100
#   @doc: Maximum number of concurrent client connections
max_connections: 100
```

### @options
Available values separated by `|`. Supports placeholders like `<hostname>` and ranges like `1-65535`.

```yaml
# log_level: info
#   @options: debug | info | warn | error
log_level: info

# port: 8080
#   @options: 1-65535
port: 8080

# server: localhost
#   @options: localhost | <hostname> | <ip_address>
server: localhost
```

### @default
The default value when not explicitly set.

```yaml
# timeout: 30
#   @default: 30
timeout: 60
```

### @why
Multi-line explanation of when to use each option.

```yaml
# storage_engine: rocksdb
#   @options: rocksdb | leveldb | memory
#   @why:
#     rocksdb — best for production, handles large datasets
#     leveldb — lighter footprint, good for development
#     memory — testing only, data lost on restart
storage_engine: rocksdb
```

### @warn
Warning message displayed in red. Use for dangerous or easily misconfigured options.

```yaml
# allow_remote: false
#   @warn: Enabling this exposes the service to the network
allow_remote: false
```

### @multi
Set to `true` for fields that accept multiple values in array format.

```yaml
# allowed_origins: []
#   @multi: true
#   @doc: CORS allowed origins
allowed_origins: [https://example.com, https://app.example.com]
```

### @related
References to related fields.

```yaml
# tls_enabled: false
#   @related: tls_cert, tls_key
tls_enabled: true
```

### @examples
Example values to help users understand expected input.

```yaml
# cron_schedule: ""
#   @examples: "0 * * * *", "0 0 * * 0", "@daily"
cron_schedule: "0 0 * * *"
```

## Multi-line Content

For `@why` or `@doc` spanning multiple lines, continue with indented comment lines:

```yaml
# cache_strategy: lru
#   @options: lru | lfu | arc
#   @why:
#     lru — evicts least recently used; good general-purpose choice
#     lfu — evicts least frequently used; better for skewed access patterns
#     arc — adaptive; auto-tunes between lru/lfu but uses more memory
cache_strategy: lru
```

## Array Values

Fields with `@multi: true` accept arrays using bracket notation:

```yaml
# dns_servers: []
#   @multi: true
#   @doc: DNS servers to use for resolution
dns_servers: [8.8.8.8, 8.8.4.4, 1.1.1.1]
```

## Best Practices

1. **Always include @doc** for every field — even if the name seems obvious
2. **Use @why for non-obvious options** — explain trade-offs, not just definitions
3. **Use @warn for dangerous options** — anything that affects security, data integrity, or performance
4. **Include @default** even if it matches the current value — helps users know what's standard
5. **Keep @doc concise** — one sentence is ideal; use @why for details

## Complete Example

```yaml
# database_config
#   @doc: Primary database connection settings

# host: localhost
#   @doc: Database server hostname
#   @options: localhost | <hostname> | <ip_address>
#   @default: localhost
host: db.internal.example.com

# port: 5432
#   @doc: Database server port
#   @options: 1-65535
#   @default: 5432
port: 5432

# pool_size: 10
#   @doc: Connection pool size
#   @default: 10
#   @warn: Values above 100 may exhaust database connections
pool_size: 25

# ssl_mode: prefer
#   @doc: SSL connection mode
#   @options: disable | allow | prefer | require | verify-ca | verify-full
#   @default: prefer
#   @why:
#     disable — no SSL; only for trusted networks
#     prefer — use SSL if available; good default
#     require — enforce SSL but skip cert verification
#     verify-full — enforce SSL with full cert verification; use in production
#   @related: ssl_cert, ssl_key
ssl_mode: verify-full

# read_replicas: []
#   @multi: true
#   @doc: Read replica hostnames for load balancing
#   @examples: replica1.db.internal, replica2.db.internal
read_replicas: [replica1.db.internal, replica2.db.internal]
```
