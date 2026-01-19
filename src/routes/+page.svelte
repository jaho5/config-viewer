<script lang="ts">
  import Node from '$lib/components/Node.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { configStore, expandAll, collapseAll, expandAllDocs, collapseAllDocs } from '$lib/store.svelte';
  import { exportNodes, parse } from '$lib/parser';

  let toast: Toast;
  let fileInput: HTMLInputElement;
  let fileName = $state('config.yaml');

  function handleExport() {
    const yaml = exportNodes(configStore.root);
    navigator.clipboard.writeText(yaml).then(() => {
      toast.show('Copied to clipboard');
    }).catch(() => {
      alert(yaml);
    });
  }

  function handleFileSelect() {
    fileInput.click();
  }

  function handleToast(msg: string) {
    toast.show(msg);
  }

  async function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    fileName = file.name;
    const text = await file.text();

    // Replace the store's root with newly parsed content
    const newRoot = parse(text);
    configStore.setRoot(newRoot);

    toast.show(`Loaded ${file.name}`);
  }
</script>

<header>
  <h1>
    <button class="file-btn" onclick={handleFileSelect}>
      {fileName}
      <span class="file-icon">📂</span>
    </button>
  </h1>
  <input
    type="file"
    accept=".yaml,.yml,.txt"
    bind:this={fileInput}
    onchange={handleFileChange}
    style="display: none"
  />
  <div class="controls">
    <button onclick={expandAll}>Expand</button>
    <button onclick={collapseAll}>Collapse</button>
    <button onclick={expandAllDocs}>Show Docs</button>
    <button onclick={collapseAllDocs}>Hide Docs</button>
    <button class="primary" onclick={handleExport}>Export</button>
  </div>
</header>

<main>
  {#each configStore.root as node, index}
    <Node {node} path={`root.${index}`} isRoot={true} onToast={handleToast} />
  {/each}
</main>

<Toast bind:this={toast} />

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: 'SF Mono', Consolas, monospace;
    font-size: 14px;
    line-height: 1.5;
    background: #1a1a2e;
    color: #eee;
    padding: 2rem;
    max-width: 900px;
    margin: 0 auto;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #333;
  }

  h1 {
    font-size: 1.2rem;
    font-weight: 500;
  }

  .file-btn {
    background: transparent;
    border: 1px solid #333;
    color: #eee;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .file-btn:hover {
    background: #252538;
    border-color: #444;
  }

  .file-icon {
    font-size: 0.9em;
  }

  .controls button {
    background: #333;
    border: none;
    color: #aaa;
    padding: 0.4rem 0.8rem;
    margin-left: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
  }

  .controls button:hover {
    background: #444;
    color: #fff;
  }

  .controls button.primary {
    background: #2563eb;
    color: #fff;
  }

  .controls button.primary:hover {
    background: #3b82f6;
  }

  main {
    min-height: 50vh;
  }
</style>
