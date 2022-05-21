const test = require('tape')
const levelup = require('levelup')
const memdown = require('memdown')
const { next, get } = require('piconuro')
const Kernel = require('../blockend/')

test('Can create tasks', async t => {
  const k = new Kernel(makeDatabase())
  await k.boot()

  let tasks = await get(k.$tasks())
  t.equal(tasks.length, 0, 'Task list is empty')
  await k.createTask('Water Plants')

  tasks = await get(k.$tasks())
  t.equal(tasks.length, 1, 'Task created :)')
  t.end()
})

test('Tasks transfer over wire', async t => {
  const alice = await spawnPeer(['Water Plants'])
  const bob = await spawnPeer(['Walk dog'])

  // Connect peers
  alice.spawnWire({ client: true }).open(bob.spawnWire())

  const aTasks = await next(alice.$tasks())
  t.equal(aTasks.length, 2, 'Alice has 2 tasks')

  const bTasks = await next(bob.$tasks())
  t.equal(bTasks.length, 2, 'Bob has 2 tasks')

  t.end()
})

test('Task-status can be updated', async t => {
  const k = new Kernel(makeDatabase())
  await k.boot()

  const tid = await k.createTask('Water Plants')
  let tasks = await get(k.$tasks())
  let status = tasks.find(t => t.id.equals(tid))?.status
  t.equal(status, 'todo', 'Task state is "todo"')

  await k.setStatus(tid, 'in-progress')

  tasks = await get(k.$tasks())
  status = tasks.find(t => t.id.equals(tid))?.status
  t.equal(status, 'in-progress', 'Task state is "in-progress"')
})

// Test Helpers
function makeDatabase () {
  return levelup(memdown())
}

async function spawnPeer (tasks = []) {
  const k = new Kernel(makeDatabase())
  await k.boot()
  for (const task of tasks) {
    await k.createTask(task)
  }
  return k
}
