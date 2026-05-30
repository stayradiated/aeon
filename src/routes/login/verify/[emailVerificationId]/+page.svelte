<script lang="ts">
import type { PageProps } from './$types'

import { enhance } from '$app/forms'

const { data, form }: PageProps = $props()
const { email } = $derived(data)
const error = $derived(form?.error)
</script>

<div class="page">
  <main>
    <h1>Verify your account</h1>
    <p>A verification email has been sent to {email}.</p>

    <form use:enhance action="?/verify" method="post">
      <label for="token">Token</label>
      <input
        id="token"
        placeholder="XXXX-XXXX"
        type="text"
        name="token"
        autocomplete="one-time-code"
        required
      />

      <button type="submit">Verify</button>

      {#if error}
        <p class="error" role="alert">{error}</p>
      {/if}
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

    text-align: center;
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--size-4);
    width: 100%;
  }

  h1 {
    font-size: var(--scale-3);
    line-height: var(--line-md);
    margin: 0;
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

  .error {
    color: red;
  }
</style>
