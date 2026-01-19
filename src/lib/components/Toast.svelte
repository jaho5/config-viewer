<script lang="ts">
  let visible = $state(false);
  let message = $state('');
  let timeout: ReturnType<typeof setTimeout>;

  export function show(msg: string) {
    message = msg;
    visible = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => visible = false, 1500);
  }
</script>

<div class="toast" class:show={visible}>
  {message}
</div>

<style>
  .toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #2563eb;
    color: #fff;
    padding: 0.8rem 1.2rem;
    border-radius: 6px;
    font-size: 13px;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }
  .toast.show { opacity: 1; }
</style>
