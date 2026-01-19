import { parse, type ConfigNode } from './parser';

// Sample config source to initialize with
const CONFIG_SOURCE = `
# @doc: Main application configuration

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

  # port: 8080
  #   @options: 1-65535
  #   @default: 8080
  #   @doc: Port to listen on
  port: 8080

  # tls:
  #   @doc: TLS/HTTPS configuration
  tls:
    # enabled: false
    #   @options: true | false
    #   @default: false
    #   @doc: Enable HTTPS
    #   @warn: Requires cert and key paths if true
    enabled: false

    # cert: null
    #   @doc: Path to TLS certificate file
    cert: null

    # key: null
    #   @doc: Path to TLS private key file
    key: null

# logging:
#   @doc: Application logging settings
logging:
  # level: info
  #   @options: trace | debug | info | warn | error | off
  #   @default: info
  #   @doc: Minimum log level to output
  level: info

  # format: text
  #   @options: text | json | pretty
  #   @default: text
  #   @doc: Log output format
  #   @why:
  #     text   — human readable, dev
  #     json   — structured, production
  #     pretty — colorized, local dev
  format: text

  # outputs:
  #   @options: stdout | stderr | file | syslog
  #   @multi: true
  #   @default: [stdout]
  #   @doc: Where to send logs. Multiple allowed.
  outputs: [stdout]

# features:
#   @doc: Feature flags
#   @options: cache | metrics | tracing | compression | rate_limit
#   @multi: true
#   @default: []
#   @doc: Enabled feature flags
features: [cache, metrics]
`;

function createConfigStore() {
	let root = $state<ConfigNode[]>(parse(CONFIG_SOURCE));

	function getNode(path: string): ConfigNode | undefined {
		const parts = path.split('.');
		if (parts[0] !== 'root' || parts.length < 2) {
			return undefined;
		}

		let current: ConfigNode | undefined = root[parseInt(parts[1], 10)];
		for (let i = 2; i < parts.length && current; i++) {
			const index = parseInt(parts[i], 10);
			current = current.children?.[index];
		}
		return current;
	}

	function toggleExpand(path: string): void {
		const node = getNode(path);
		if (node && node.children && node.children.length > 0) {
			node.expanded = !node.expanded;
		}
	}

	function toggleDocs(path: string): void {
		const node = getNode(path);
		if (node) {
			node.docsExpanded = !node.docsExpanded;
		}
	}

	function toggleOptionsExpand(path: string): void {
		const node = getNode(path);
		if (node) {
			node.optionsExpanded = !node.optionsExpanded;
		}
	}

	function setValue(path: string, value: string): void {
		const node = getNode(path);
		if (node) {
			node.value = value;
		}
	}

	function setAllExpanded(nodes: ConfigNode[], expanded: boolean): void {
		for (const node of nodes) {
			if (node.children && node.children.length > 0) {
				node.expanded = expanded;
				setAllExpanded(node.children, expanded);
			}
		}
	}

	function expandAll(): void {
		setAllExpanded(root, true);
	}

	function collapseAll(): void {
		setAllExpanded(root, false);
	}

	function setAllDocsExpanded(nodes: ConfigNode[], expanded: boolean): void {
		for (const node of nodes) {
			if (Object.keys(node.meta).length > 0) {
				node.docsExpanded = expanded;
			}
			if (node.children && node.children.length > 0) {
				setAllDocsExpanded(node.children, expanded);
			}
		}
	}

	function expandAllDocs(): void {
		setAllDocsExpanded(root, true);
	}

	function collapseAllDocs(): void {
		setAllDocsExpanded(root, false);
	}

	return {
		get root() {
			return root;
		},
		setRoot(newRoot: ConfigNode[]) {
			root.length = 0;
			root.push(...newRoot);
		},
		getNode,
		toggleExpand,
		toggleDocs,
		toggleOptionsExpand,
		setValue,
		expandAll,
		collapseAll,
		expandAllDocs,
		collapseAllDocs
	};
}

export const configStore = createConfigStore();

// Re-export functions for convenience
export const { toggleExpand, toggleDocs, toggleOptionsExpand, setValue, expandAll, collapseAll, expandAllDocs, collapseAllDocs } = configStore;
