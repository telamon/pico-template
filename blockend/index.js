const { SimpleKernel } = require('picostack')
const { mute } = require('piconuro')

const TasksSlice = require('./slices/tasks.js')

class Kernel extends SimpleKernel {
  constructor (db) {
    super(db) // Initialize superclass

    // Register slices/reducers
    this.store.register(TasksSlice())
  }

  async createTask (title = 'unnamed task') {
    const feed = await this.createBlock('task', {
      title,
      status: 'todo'
    })
    return feed.last.sig // Task id
  }

  async setStatus (taskId, status) {
    const feed = await this.createBlock('update', {
      taskId, status
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
        owner: userId?.equals(task.author),
        writable: true // TODO: !!task.accessList.find(k => k.equals(userId)
      }))
        // Sort by activity
        .sort((a, b) => b.updatedAt - a.updatedAt)
    )
  }
}

module.exports = Kernel
