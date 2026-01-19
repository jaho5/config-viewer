<script lang="ts">
  import { toggleExpand, toggleDocs, setValue, toggleOptionsExpand } from '$lib/store.svelte';
  import { parseValue, formatValue, type ConfigNode } from '$lib/parser';
  import Node from './Node.svelte';

  const MAX_VISIBLE_OPTIONS = 4;

  interface Props {
    node: ConfigNode;
    path: string;
    isRoot?: boolean;
    onToast?: (msg: string) => void;
  }

  let { node, path, isRoot = false, onToast }: Props = $props();

  let editing = $state(false);
  let editValue = $state('');

  function toast(msg: string) {
    onToast?.(msg);
  }

  function handleArrowClick() {
    toggleExpand(path);
  }

  function handleDocsClick() {
    toggleDocs(path);
  }

  function handleValueClick() {
    editValue = node.value ?? '';
    editing = true;
  }

  function handleInputBlur() {
    if (editing) {
      setValue(path, editValue);
      toast(`Updated ${node.key}`);
      editing = false;
    }
  }

  function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      setValue(path, editValue);
      toast(`Updated ${node.key}`);
      editing = false;
    } else if (e.key === 'Escape') {
      editing = false;
    }
  }

  function handleOptionClick(optionValue: string) {
    const isMulti = node.meta?.multi === 'true';
    if (isMulti) {
      // Toggle option in array value like [cache, metrics]
      const current = parseValue(node.value ?? '');
      const currentArr = Array.isArray(current) ? current : [];
      const index = currentArr.indexOf(optionValue);
      if (index >= 0) {
        currentArr.splice(index, 1);
      } else {
        currentArr.push(optionValue);
      }
      const newValue = formatValue(currentArr);
      setValue(path, newValue);
      toast(`${node.key}: ${newValue}`);
    } else {
      setValue(path, optionValue);
      toast(`${node.key}: ${optionValue}`);
    }
  }

  function handleMoreClick(e: Event) {
    e.stopPropagation();
    toggleOptionsExpand(path);
  }

  const isLeaf = $derived(node.children.length === 0);
  const hasOptions = $derived(!!node.meta?.options);
  const isMulti = $derived(node.meta?.multi === 'true');
  // Options use | separator
  const options = $derived(hasOptions ? node.meta.options.split('|').map(o => o.trim()) : []);
  const visibleOptions = $derived(node.optionsExpanded ? options : options.slice(0, MAX_VISIBLE_OPTIONS));
  const hiddenCount = $derived(options.length - MAX_VISIBLE_OPTIONS);
  const hasMeta = $derived(Object.keys(node.meta).length > 0);
  // Parse value to check selection (handles [a, b] array format)
  const parsedValue = $derived(parseValue(node.value ?? ''));
  const selectedValues = $derived(Array.isArray(parsedValue) ? parsedValue : [parsedValue]);

  // Check if option is a placeholder like <hostname> or range like 1-65535
  function isPlaceholder(opt: string): boolean {
    return opt.startsWith('<') || /^\d+-\d+$/.test(opt);
  }

  // Meta tag display order and labels (matching original HTML)
  const metaOrder = ['default', 'doc', 'why', 'warn', 'related', 'examples'];
  const metaLabels: Record<string, string> = {
    default: 'Default',
    doc: 'Description',
    why: 'When to change',
    warn: 'Warning',
    related: 'Related',
    examples: 'Examples'
  };

  const orderedMeta = $derived(
    metaOrder
      .filter(tag => node.meta[tag])
      .map(tag => ({ tag, label: metaLabels[tag], value: node.meta[tag] }))
  );
</script>

<div class="node" class:root={isRoot}>
  <div class="node-header">
    {#if !isLeaf}
      <span class="arrow" onclick={handleArrowClick} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && handleArrowClick()}>
        {node.expanded ? '▼' : '▶'}
      </span>
    {:else}
      <span class="arrow-spacer"></span>
    {/if}

    <span class="key">{node.key}</span>

    {#if isLeaf}
      <span class="colon">:</span>
      {#if editing}
        <input
          class="value-input"
          type="text"
          bind:value={editValue}
          onblur={handleInputBlur}
          onkeydown={handleInputKeydown}
          autofocus
        />
      {:else}
        <span class="value" onclick={handleValueClick} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && handleValueClick()}>
          {node.value ?? ''}
        </span>
      {/if}

      {#if hasOptions}
        <span class="options">
          {#each visibleOptions as option, i}
            {#if isPlaceholder(option)}
              <span class="option-placeholder">{option}</span>
            {:else}
              <span
                class="option"
                class:selected={selectedValues.includes(option)}
                onclick={() => handleOptionClick(option)}
                role="button"
                tabindex="0"
                onkeydown={(e) => e.key === 'Enter' && handleOptionClick(option)}
              >
                {option}
              </span>
            {/if}
            {#if !isMulti && i < visibleOptions.length - 1}
              <span class="separator">|</span>
            {/if}
          {/each}
          {#if hiddenCount > 0}
            <span class="more" onclick={handleMoreClick} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && handleMoreClick(e)}>
              {node.optionsExpanded ? 'less' : `+${hiddenCount} more`}
            </span>
          {/if}
        </span>
      {/if}
    {/if}

    {#if hasMeta}
      <span class="docs-toggle" onclick={handleDocsClick} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && handleDocsClick()}>
        [?]
      </span>
    {/if}
  </div>

  {#if node.docsExpanded && hasMeta}
    <div class="details">
      {#each orderedMeta as { tag, label, value }}
        <div class="tag">
          <div class="tag-name">{label}</div>
          <div class="tag-content" class:warn={tag === 'warn'} class:examples={tag === 'examples'}>{value}</div>
        </div>
      {/each}
    </div>
  {/if}

  {#if !isLeaf && node.expanded}
    <div class="children">
      {#each node.children as child, index}
        <Node node={child} path={`${path}.${index}`} {onToast} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .node {
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.6;
  }

  .node.root {
    padding: 1rem;
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 2px 0;
  }

  .arrow {
    cursor: pointer;
    user-select: none;
    width: 1rem;
    text-align: center;
    color: #888;
  }

  .arrow:hover {
    color: #fff;
  }

  .arrow-spacer {
    width: 1rem;
  }

  .key {
    color: #22d3ee;
  }

  .colon {
    color: #888;
    margin-right: 0.5rem;
  }

  .value {
    color: #facc15;
    cursor: pointer;
    padding: 0 0.25rem;
    border-radius: 2px;
  }

  .value:hover {
    background: rgba(250, 204, 21, 0.1);
  }

  .value-input {
    background: #1e1e1e;
    border: 1px solid #22d3ee;
    color: #facc15;
    font-family: inherit;
    font-size: inherit;
    padding: 0 0.25rem;
    outline: none;
    border-radius: 2px;
  }

  .options {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    margin-left: 0.75rem;
    font-size: 12px;
  }

  .option {
    color: #888;
    cursor: pointer;
    padding: 0 0.25rem;
    border-radius: 2px;
    border: 1px solid transparent;
  }

  .option:hover {
    color: #fff;
    border-color: #444;
  }

  .option.selected {
    background: #2563eb;
    color: #fff;
  }

  .option.selected:hover {
    background: #1d4ed8;
    color: #fff;
  }

  .option-placeholder {
    color: #666;
  }

  .separator {
    color: #666;
  }

  .more {
    color: #666;
    cursor: pointer;
    font-style: italic;
  }

  .more:hover {
    color: #888;
  }

  .docs-toggle {
    color: #666;
    cursor: pointer;
    margin-left: 0.5rem;
  }

  .docs-toggle:hover {
    color: #22d3ee;
  }

  .details {
    padding: 0.6rem 1rem;
    margin: 0.25rem 0 0.25rem 1.5rem;
    background: #16162a;
    border-radius: 4px;
    font-size: 13px;
  }

  .tag {
    margin-bottom: 0.6rem;
  }

  .tag:last-child {
    margin-bottom: 0;
  }

  .tag-name {
    color: #888;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.2rem;
  }

  .tag-content {
    color: #ccc;
    white-space: pre-wrap;
  }

  .tag-content.warn {
    color: #f87171;
  }

  .tag-content.examples {
    background: #1e1e32;
    padding: 0.5rem 0.8rem;
    border-radius: 4px;
  }

  .children {
    margin-left: 1rem;
    border-left: 1px solid #333;
    padding-left: 0.5rem;
  }
</style>
