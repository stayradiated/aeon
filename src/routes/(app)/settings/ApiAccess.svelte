<script lang="ts">
import { setApiToken } from './set-api-token.remote.js'

let apiToken = $state<string>()

const handleReset = async () => {
  if (window.confirm('Are you sure you want to reset the current API token?')) {
    apiToken = await setApiToken()
  }
}
</script>

<h2>API Access</h2>

{#if apiToken}
  <pre><code>{apiToken}</code></pre>
  <p>Copy this token, it will only be shown once!</p>
{:else}
  <pre><code>aeon.**************************.*******************************************</code></pre>
  <button onclick={handleReset}>Reset API Token</button>
{/if}
<details>
  <summary><strong>API Docs</strong></summary>
  <strong>Get Status</strong>
  <pre><code>curl https://aeon.party/api/v1/status -H "Authorization: Bearer API_TOKEN"</code></pre>
</details>
