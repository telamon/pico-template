<script>
/**
  It was fun writing this component, keep if useful.
*/

// Keep this component or throw it away, It was fun
import {
  purge,
  run,
  connections,
  kernel,
  svlt
} from './api.js'
import { mute, combine } from 'piconuro'


// When reducer was changed rerun available blocks
async function reloadStore () {
  await kernel.store.reload()
    .then(() => console.info('Reloaded store successfully'))
    .catch(error => {
      console.error('Reload failed:', error)
    })
}

// https://stackoverflow.com/questions/1248302/how-to-get-the-size-of-a-javascript-object
function roughSizeOf(object) {
  const objectList = []
  const stack = [ object ]
  let bytes = 0
  while (stack.length) {
    const value = stack.pop()
    if (typeof value === 'boolean') bytes += 4
    else if (typeof value === 'string') bytes += value.length * 2
    else if (typeof value === 'number') bytes += 8
    else if (
      typeof value === 'object'
      && objectList.indexOf(value) === -1
    ) {
      objectList.push(value)
      for(const i in value ) stack.push(value[i])
    }
  }
  return bytes
}
const sliceNames = Object.keys(kernel.store.state)
const combinedStateNeuron = combine(
  ...sliceNames.map(name => sub => kernel.store.on(name, sub))
)

const stateMemory = svlt(
  mute(
    mute(
      combinedStateNeuron,
      states => states.reduce((sum, state) => sum + roughSizeOf(state), 0)
    ),
    bytes => (bytes / 1024).toFixed(2) // kilos
  )
)

/**
* Wishlist let picostore keep track of bytes and blocks accepted
* and expunged.
*/
const nBlocks = svlt(
  mute(
    combinedStateNeuron,
    () => kernel.store._stores.reduce((sum, s) => sum + s.version, 0)
  )
)

</script>
<code>
  <span class="ctrls">
    <btn class="inverse" on:click={reloadStore}>Reload</btn>
    <btn class="inverse" on:click={purge}>Purge</btn>
  </span>
  <span class="primary">
    [DevBar]
  </span>
  Kernel: <strong>{$run}</strong>
  Peers: <strong>{$connections}</strong>
  Blocks: <strong>{$nBlocks}</strong>
  Memory: <strong>{$stateMemory}kB</strong>
</code>
<style>
code { display: block; }
.ctrls {
  float: right;
}
.primary { color: var(--primary); }
</style>
