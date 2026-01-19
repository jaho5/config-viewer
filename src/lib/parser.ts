/**
 * YAML-like config parser with metadata support
 */

// Types

export interface ConfigNode {
  key: string;
  value: string | null;
  originalValue: string | null;
  meta: Record<string, string>;
  children: ConfigNode[];
  expanded: boolean;
  docsExpanded: boolean;
  optionsExpanded: boolean;
}

interface ParsedLine {
  type: 'empty' | 'comment' | 'key';
  indent: number;
  content?: string;
  key?: string;
  value?: string;
}

// Parser functions

export function parse(source: string): ConfigNode[] {
  const lines = source.split('\n');

  // First pass: pair each line with its indent and type
  const parsed: ParsedLine[] = [];
  for (const line of lines) {
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const content = line.slice(indent);

    if (!content) {
      parsed.push({ type: 'empty', indent, content });
    } else if (content.startsWith('#')) {
      parsed.push({ type: 'comment', indent, content: content.slice(1) });
    } else {
      const kvMatch = content.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)?$/);
      if (kvMatch) {
        parsed.push({ type: 'key', indent, key: kvMatch[1], value: kvMatch[2] || '' });
      }
    }
  }

  // Second pass: build tree, attaching comments to following key at same indent
  let idx = 0;

  function buildTree(minIndent: number): ConfigNode[] {
    const children: ConfigNode[] = [];
    let commentBuffer: string[] = [];
    let commentIndent: number | null = null;

    while (idx < parsed.length) {
      const item = parsed[idx];

      if (item.type === 'empty') {
        idx++;
        continue;
      }

      if (item.type === 'comment') {
        if (item.indent < minIndent) break;
        if (commentIndent === null) commentIndent = item.indent;
        commentBuffer.push(item.content || '');
        idx++;
        continue;
      }

      if (item.type === 'key') {
        if (item.indent < minIndent) break;
        if (item.indent >= minIndent) {
          idx++;
          let nodeChildren: ConfigNode[] = [];
          if (idx < parsed.length) {
            let peekIdx = idx;
            while (
              peekIdx < parsed.length &&
              (parsed[peekIdx].type === 'empty' || parsed[peekIdx].type === 'comment')
            ) {
              peekIdx++;
            }
            if (peekIdx < parsed.length && parsed[peekIdx].indent > item.indent) {
              nodeChildren = buildTree(parsed[peekIdx].indent);
            }
          }

          const meta =
            commentIndent === null || commentIndent <= item.indent
              ? parseTags(commentBuffer)
              : {};
          const hasChildren = nodeChildren.length > 0;
          const value = hasChildren ? null : (item.value ?? '');

          children.push({
            key: item.key || '',
            value,
            originalValue: value,
            meta,
            children: nodeChildren,
            expanded: true,
            docsExpanded: false,
            optionsExpanded: false,
          });

          commentBuffer = [];
          commentIndent = null;
          continue;
        }
      }
      idx++;
    }
    return children;
  }

  return buildTree(0);
}

export function parseTags(lines: string[]): Record<string, string> {
  const meta: Record<string, string> = {};
  let currentTag: string | null = null;
  let content: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*@(\w+):\s*(.*)/);
    if (match) {
      if (currentTag) meta[currentTag] = dedent(content);
      currentTag = match[1];
      content = match[2] ? [match[2]] : [];
    } else if (currentTag) {
      content.push(line);
    }
  }
  if (currentTag) meta[currentTag] = dedent(content);
  return meta;
}

export function dedent(lines: string[]): string {
  if (!lines.length) return '';
  const indents = lines
    .filter((l) => l.trim())
    .map((l) => {
      const match = l.match(/^(\s*)/);
      return match ? match[1].length : 0;
    });
  const min = Math.min(...indents, Infinity);
  if (min === Infinity) return lines.join('\n').trim();
  return lines
    .map((l) => l.slice(min))
    .join('\n')
    .trim();
}

// Helper functions

/**
 * Parse a value string, detecting array syntax [a, b, c]
 */
export function parseValue(val: string): string | string[] {
  const trimmed = val.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1);
    if (!inner.trim()) return [];
    return inner.split(',').map((item) => item.trim());
  }
  return val;
}

/**
 * Format a value back to string, converting arrays to [a, b] syntax
 */
export function formatValue(val: string | string[]): string {
  if (Array.isArray(val)) {
    return `[${val.join(', ')}]`;
  }
  return val;
}

/**
 * Export ConfigNode tree back to YAML-like string
 */
export function exportNodes(nodes: ConfigNode[], indent: number = 0): string {
  const lines: string[] = [];
  const indentStr = '  '.repeat(indent);

  for (const node of nodes) {
    // Add metadata comments
    for (const [tag, content] of Object.entries(node.meta)) {
      const contentLines = content.split('\n');
      if (contentLines.length === 1) {
        lines.push(`${indentStr}# @${tag}: ${content}`);
      } else {
        lines.push(`${indentStr}# @${tag}: ${contentLines[0]}`);
        for (let i = 1; i < contentLines.length; i++) {
          lines.push(`${indentStr}#   ${contentLines[i]}`);
        }
      }
    }

    // Add the key-value or key with children
    if (node.children.length > 0) {
      lines.push(`${indentStr}${node.key}:`);
      lines.push(exportNodes(node.children, indent + 1));
    } else {
      const value = node.value ?? '';
      lines.push(`${indentStr}${node.key}: ${value}`);
    }
  }

  return lines.join('\n');
}
