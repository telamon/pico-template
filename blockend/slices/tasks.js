const { decodeBlock } = require('picostack').SimpleKernel
const ALLOWED_STATES = ['todo', 'in-progress', 'to-verify', 'done', 'wontfix']
function TasksSlice () {
  return {
    name: 'tasks', // Sets the name of this slice/registry

    initialValue: [], // Initial value slice value.

    filter ({ block, state }) {
      const data = decodeBlock(block.body)
      const { type } = data

      switch (type) {
        // Validate create task blocks
        case 'task': {
          const { title, date } = data
          // Reject task invalid blocks with a reason
          if (!title || title === '') return 'Task Must have a title'
          if (date > Date.now()) return 'Task from future'
        } break

        // Validate update status blocks
        case 'update': {
          const { taskId, status } = data
          if (!ALLOWED_STATES.find(s => status)) return 'InvalidStatus'

          // Validate block against existing state
          const task = state.find(t => t.id.equals(taskId))

          if (!task) return 'TaskNotFound'
          if (task.status === status) return 'StatusNotNew'

          // Give write access the author.
          // if (!task.author.equals(block.key)) return 'AccessDenied'
          // TODO: write access to friends
        } break

        // Silently ignore unrelated blocks
        // to give other slices a chance to handle it.
        default:
          return true
      }

      // Accept valid block
      return false
    },

    // Apply block content to mutate state
    reducer ({ block, state }) {
      const tasks = [...state]
      const data = decodeBlock(block.body)
      const { type } = data

      switch (type) {
        case 'task': {
          const task = data
          // Set task-id to the block-signature that created it.
          // this will be useful later when we attempt to update it's status.
          task.id = block.sig
          task.author = block.key
          task.updated = data.date

          tasks.push(task) // Append task to list
        } break

        case 'update': {
          const task = tasks.find(t => t.id.equals(data.taskId))
          task.updated = data.date
          task.status = data.status
        } break
      }
      return Object.freeze(tasks)
    }
  }
}
module.exports = TasksSlice
