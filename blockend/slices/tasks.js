const { decodeBlock } = require('picostack').SimpleKernel
const {
  ALLOWED_STATES,
  OWNERSHIP_CHANGE
} = require('../constants')

function TasksSlice () {
  return {
    name: 'tasks', // Sets the name of this slice/registry

    initialValue: [], // Initial value slice value.

    filter ({ block, state }) {
      const payload = decodeBlock(block.body)
      const { type } = payload
      switch (type) {
        // Validate create task blocks
        case 'task': {
          const { title, date } = payload
          // Reject task invalid blocks with a reason
          if (!title || title === '') return 'Task Must have a title'
          if (date > Date.now()) return 'Task from future'
        } break

        // Validate update status blocks
        case 'update': {
          const { status } = payload
          if (!ALLOWED_STATES.find(s => status)) return 'InvalidStatus'

          // Validate block against existing state
          const task = findTaskByHead(state, block.parentSig)
          if (!task) return 'TaskNotFound'

          if (task.status === status) return 'StatusNotNew'
          if (!task.owner.equals(block.key)) return 'AccessDenied'
        } break

        // Validate 'assign/lease' blocks
        case 'assign': {
          const task = findTaskByHead(state, block.parentSig)
          if (!task) return 'TaskNotFound'

          // Either we can lock down the assign capabilities to
          // task-author.
          if (!task.author.equals(block.key)) return 'AccessDenied'

          // Or the current owner (subleasing)
          // if (!task.owner.equals(block.key)) return 'AccessDenied'
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
      const payload = decodeBlock(block.body)
      const { type } = payload

      switch (type) {
        case 'task': {
          const task = payload
          // Set task-id to the block-signature that created it.
          task.id = block.sig
          task.author = block.key
          task.updated = payload.date
          task.owner = block.key
          task.head = block.sig
          tasks.push(task) // Append task to list
        } break

        case 'update': {
          const task = findTaskByHead(state, block.parentSig)
          task.updated = payload.date
          task.status = payload.status
          task.head = block.sig

          if (~OWNERSHIP_CHANGE.indexOf(task.status)) {
            task.owner = task.author
          }
        } break

        case 'assign': {
          const task = findTaskByHead(state, block.parentSig)
          task.updated = payload.date
          task.owner = payload.owner
          task.head = block.sig
          break
        }
      }
      return Object.freeze(tasks)
    }
  }
}

// TODO: extend picostore/repo with custom indices?
function findTaskByHead (state, sig) {
  return state.find(t => t.head.equals(sig))
}
module.exports = TasksSlice
