<script>
import { boot } from './api'
import Tasks from './Tasks.svelte'
import Devbar from './DevelopersBar.svelte'

const bootloader = boot()
</script>
<main class="container">
  <!-- "Hello" section -->
  <section>
    <h1>PiCO<sub>stack<sub></h1>
    <h2 class="tagline"><small> 0% Backend, 10'000% Frontend</small></h2>
    <h2>Hello Web 3.0</h2>
    <p>
      This is the
      <strong><a href="https://github.com/telamon/picostack">pico-stack</a></strong>
      quickstart template.<br/>
      To build your own <strong>true</strong> decentralized web-app run:
    </p>
    <pre><code>
      &gt; npx degit <a href="https://github.com/telamon/pico-template">telamon/pico-template</a> my-project
    </code></pre>
    <p>
      We're building a DIY blockchain toolkit that ignores crypto-economy
      and focuses on application logic .
      <br/>
      <br/>
      <i>Coinless Blockchain, a means to longer lasting decentralization.</i>
    </p>
  </section>

  <!-- Wait for bootloader then show Tasks -->
  {#await bootloader}
    <h3>Loading kernel...</h3>
    <progress value="7" max="100" indeterminate="true"></progress>
  {:then}
    <Tasks/>
  {:catch error}
    <h3>Boot failure!</h3>
    <p>{error.name}</p>
    <pre>{error.stackTrace}</pre>
  {/await}

  <!-- nice to have -->
  <Devbar/>

  <!-- Remove/replace this line :) -->
  <footer>Pico ❤️ DecentLabs 2022</footer>
</main>
<style>
  h1 {
    text-align: center;
    font-size: 4em;
    color: var(--primary);
    margin-bottom: 0;
  }
  footer {
    text-align: center;
    margin-top: 3em;
  }
  .tagline { text-align: center; }
  .tagline small { color: gray; font-weight: normal; }

</style>
