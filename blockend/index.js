const { SimpleKernel, Feed } = require('picostack')
const { mute } = require('piconuro')

const TasksSlice = require('./slices/tasks.js')

class Kernel extends SimpleKernel {
  constructor (db) {
    super(db) // Initialize superclass
    this.repo.allowDetached = true
    // Register slices/reducers
    this.store.register(TasksSlice())
  }

  async createTask (title = 'unnamed task') {
    const branch = new Feed() // create new branch
    const feed = await this.createBlock(branch, 'task', {
      title,
      status: 'todo'
    })
    return feed.last.sig // Task id
  }

  async setStatus (taskId, status) {
    // Load issue-feed.
    const branch = await this.repo.resolveFeed(taskId)
    if (!branch) throw new Error('unknown task')
    const feed = await this.createBlock(branch, 'update', {
      taskId, status
    })
    return feed.last.id // block id
  }

  async assign (taskId, pk) {
    const branch = await this.repo.resolveFeed(taskId)
    if (!branch) throw new Error('unknown task')
    const feed = await this.createBlock(branch, 'assign', {
      owner: pk
      // permissions: '*', // TODO: selective updates
      // leaseTime: 24*60*60*1000, // TODO: auto-release
    })
    return feed.last.id // block id
  }

  // Expose subscribable list of tasks
  $tasks () {
    const userId = this.pk

    // Create neuron
    const $n = subscriber => this.store.on('tasks', subscriber)

    // Enrich low-level state with high-level variables
    return mute(
      $n,
      tasks => tasks.map(task => ({
        ...task,
        writable: userId?.equals(task.owner)
      }))
        // Sort by activity
        .sort((a, b) => b.updatedAt - a.updatedAt)
    )
  }

  // This app uses many feeds per author.
  // Modified onquery handler using repo.listFeeds() instead of
  // repo.listHeads().
  async onquery (params) {
    const feeds = []
    const heads = await this.repo.listFeeds()
    for (const { value } of heads) {
      const f = await this.repo.resolveFeed(value)
      if (f) feeds.push(f)
    }
    return feeds
  }
}

module.exports = Kernel
