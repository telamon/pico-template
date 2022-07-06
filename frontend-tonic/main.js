import levelup from 'levelup'
import leveljs from 'level-js'
import Tonic from '@socketsupply/tonic/index.esm.js'
import { write, mute, combine } from 'piconuro'
import Kernel from '../blockend/'

// -- Bootloader / KernelAPI
export function makeDatabase (name = 'picotodo') {
  levelup(leveljs('picotodo'))
}
const Modem56 = window.Modem56

// Change topic to something else if
// you want to have a private todo-board.
const TOPIC = 'picotodo-testnet'
const DB = levelup(leveljs('picotodo')) // Open IndexedDB

export const kernel = new Kernel(DB)

const [$run, setRun] = write('off')

// The bootloader ensures your kernel is started when app is started
let bootLock = null
export async function boot () {
  // Prevent boot-races
  if (bootLock) return bootLock
  let done = null
  bootLock = new Promise((resolve, reject) => {
    done = err => !err ? resolve() : (setRun('error') && reject(err))
  })
  setRun('booting')

  // Initializes slices/stores and peers identity.
  await kernel.boot()

  // Connect to swarm
  if (!Modem56) throw new Error('Modem not available, did you load it?')
  const modem = new Modem56()
  modem.join(TOPIC, () => kernel.spawnWire())
  setRun('running')
  done()
  return bootLock
}

// Export connections count as a number instead of list of nodes
export const $connections = mute(
  kernel.$connections(),
  nodes => nodes.length
)

/**
 * Clears out the blockstore and any other values
 */
export async function purge () {
  const msg = 'Permanently wipe ALL data, you sure?'
  if (!window.confirm(msg)) return
  await kernel.db.clear()
  window.location.reload()
}

// -- Components
Tonic.add(function MainComponent () {
  const { run, connections, tasks } = this.props
  const taskList = tasks?.map(task =>
    this.html`<issue-item data="${task}"></issue-item>`
  )
  return this.html`
    <p>KernelState: ${run}, Peers: ${connections}</p>
    <issues>${taskList}</issue>
  `
})

Tonic.add(function IssueItem () {
  const task = this.props.data
  console.info(task)
  const options = ['todo', 'in-progress', 'to-verify', 'done']
    .map(s => this.html`
      <option value="${s}" ${(s === task.status && 'selected') || ''}>${s}</option>
    `)
  return this.html`
    <p><strong>${task.title}</strong></p>
    <table>
      <tr>
        <td>id:</td>
        <td><samp>${task.id.toString('hex').slice(0, 8)}</samp></td>
      </tr>
      <tr>
        <td>Status</td>
        <td>
          <select name="status">
            ${options}
          </select>
        </td>
      </tr>
      <tr>
        <td>writable</td> <td>${task.write ? 'yup' : 'nope'}</td>
      </tr>
      <tr>
        <td>created</td> <td>${new Date(task.date).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td>updated</td> <td>${new Date(task.updated).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td>destroyedIn</td> <td>${task.expiredAt}</td>
      </tr>
    </table>
  `
})

// -- Hookup Nuro outputs to Tonic reRender
//
// This approach creates a state buffer..
// it's not quite as bad as VDOM but it re-renders
// everything on every change. not selectively.
const $props = combine({
  run: $run,
  tasks: kernel.$tasks(),
  connections: $connections
})
$props(props =>
  document.getElementById('main')?.reRender(props)
)

// -- Power on!
boot()
  .then(() => console.log('Booted'))
  .catch(err => console.error('Bootfailure', err))
