<script lang="ts">
import { enhance } from '$app/forms'
</script>

<div class="page">
  <main>
    <h1>Log in to Aeon</h1>

    <form use:enhance action="?/login" method="post">
      <label for="email">Email address</label>
      <input
        id="email"
        placeholder="Enter your email address…"
        type="email"
        name="email"
        autocomplete="email"
        inputmode="email"
        required
      />

      <button type="submit">Let's go</button>
    </form>
  </main>
</div>

<style>
  .page {
    position: absolute;
    inset: 0;

    display: grid;
    justify-items: center;
    align-items: center;
  }

  main {
    max-width: var(--width-xs);
    width: 100%;
    background: var(--color-grey-50);
    padding: var(--size-4);

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--size-4);
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--size-4);
  }

  h1 {
    font-size: var(--scale-3);
    line-height: var(--line-md);
  }

  label {
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    font-size: var(--scale-00);
    letter-spacing: var(--letter-lg);
  }

  input {
    font-size: var(--scale-1);
    line-height: var(--line-md);
    padding: var(--size-2);
  }

  button {
    background: var(--color-blue-500);
    color: var(--color-grey-50);
    font-weight: var(--weight-bold);
    border: none;
    line-height: var(--line-xl);
    padding-inline: var(--size-4);
  }
</style>
