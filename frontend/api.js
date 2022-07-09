/*
 * This file boots the Kernel using browser's database
 * and connects it to the swarm.
 *
 * It also exports the state as readable svelte stores
 * and the Kernel itself to expose it's actions.
 */

import levelup from 'levelup'
import leveljs from 'level-js'
import { readable } from 'svelte/store'
import { nfo, write, mute } from 'piconuro'
import Kernel from '../blockend/'
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
  try {
    // Initializes slices/stores and peers identity.
    await kernel.boot()

    // Connect to swarm
    if (!Modem56) throw new Error('Modem not available, did you load it?')
    const modem = new Modem56()
    modem.join(TOPIC, () => kernel.spawnWire())
    setRun('running')
    done()
  } catch (err) {
    done(err)
  }
  return bootLock
}

// Pico::N(e)uro -> svelte adapter
export function svlt (neuron, dbg) {
  return readable(null, set =>
    !dbg
      ? neuron(set)
      : nfo(neuron, dbg)(set)
  )
}

// Export Readable stores
export const run = svlt($run)
export const tasks = svlt(kernel.$tasks())

// Export connections count as a number instead of list of nodes
export const connections = svlt(
  mute(kernel.$connections(), nodes => nodes.length)
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
