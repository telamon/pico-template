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
  const alice = await spawnPeer(['Water Plants', 'Feed cat'])
  const bob = await spawnPeer(['Walk dog'])

  // Connect peers
  alice.spawnWire({ client: true }).open(bob.spawnWire())

  const aTasks = await next(alice.$tasks())
  t.equal(aTasks.length, 3, 'Alice has 3 tasks')
  const bTasks = await next(bob.$tasks(), 2)
  t.equal(bTasks.length, 3, 'Bob has 3 tasks')
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

test("Bob can't modify alice's task", async t => {
  const alice = await spawnPeer(['Eat cookie'])
  const bob = await spawnPeer()

  // Connect peers
  alice.spawnWire({ client: true }).open(bob.spawnWire())

  const [task] = await next(bob.$tasks())
  t.ok(task, 'Bob sees the cookie')
  t.notOk(task.writable, 'Does not belong to bob')
  try {
    await bob.setStatus(task.id, 'done')
    t.fail('Bob ate the cookie')
  } catch (err) {
    t.equal(err.message, 'InvalidBlock: AccessDenied', 'Kernel says no')
    t.end()
  }
})

test('Alice can assign the task to bob', async t => {
  const alice = await spawnPeer(['Run a mile'])
  const bob = await spawnPeer()

  // Connect peers
  alice.spawnWire({ client: true }).open(bob.spawnWire())

  let [task] = await next(bob.$tasks())
  t.ok(task, 'Bob sees the task')
  t.notOk(task.writable, 'Does not belong to bob')

  await alice.assign(task.id, bob.pk)

  task = (await next(bob.$tasks()))[0]
  t.ok(task.writable, 'Belongs to bob')

  await bob.setStatus(task.id, 'in-progres')
  await bob.setStatus(task.id, 'done')

  task = (await next(alice.$tasks()))[0]
  t.equal(task.status, 'done', 'Bob claims to have completed the task')
  t.ok(task.writable, 'Implicitly belongs to alice when done')
  await alice.setStatus(task.id, 'todo')

  await next(bob.$tasks()) // Give peers time to sync
  await dump(alice.repo, 'a.dot')
  await dump(bob.repo, 'b.dot')
})

test.skip('swarm playground', async t => {
  const alice = await spawnPeer(['nice frontend', 'working blockend'])
  const bob = await spawnPeer(['Find something to do'])
  const charlie = await spawnPeer(['Take my meds'])
  const [a1, a2] = get(alice.$tasks()).map(t => t.id)
  const [bt] = get(bob.$tasks()).map(t => t.id)
  const [ct] = get(charlie.$tasks()).map(t => t.id)

  // Connect peers
  alice.spawnWire({ client: true }).open(bob.spawnWire())
  bob.spawnWire({ client: true }).open(charlie.spawnWire())

  let aTasks = await next(alice.$tasks(), 2)
  t.equal(aTasks.length, 4, 'Alice has 4 tasks')
  await Promise.all([
    alice.assign(a1, bob.pk),
    alice.setStatus(a2, 'in-progress')
      .then(() => alice.assign(a2, charlie.pk)),
    bob.setStatus(bt, 'in-progress'),
    charlie.setStatus(ct, 'to-verify')
      .then(() => charlie.assign(ct, alice.pk))
  ])

  // TODO: maybe const aClock = await next(alice.$clock())

  aTasks = await next(alice.$tasks(), 1)
  await next(charlie.$tasks(), 2)

  // Next round
  await Promise.all([
    alice.setStatus(ct, 'wontfix'),
    bob.setStatus(a1, 'in-progress')
      .then(() => bob.setStatus(a1, 'done')),
    charlie.setStatus(a2, 'to-verify')
  ])

  await dump(alice.repo, 'a.dot')
  await dump(bob.repo, 'b.dot')
  t.end()
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

async function dump (repo, name = 'repo.dot') {
  require('picorepo/dot').dump(repo, name, {
    blockLabel (block) {
      const id = block.sig.hexSlice(0, 4)
      const author = block.key.hexSlice(0, 4)
      const d = Kernel.decodeBlock(block.body)
      let str = `ID ${id}\n👤${author}\ntype: ${d.type}\n`
      if (d.type === 'task') str += `title: ${d.title}`
      if (d.type === 'assign') str += `to: 👤${d.owner.hexSlice(0, 4)}`
      if (d.type === 'update') str += `stat: ${d.status}`
      return str
    }
  })
}
