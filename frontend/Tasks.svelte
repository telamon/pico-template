<script>
import { writable } from 'svelte/store'
import {
  kernel,
  tasks,
  connections
} from './api'

// Add Task
const title = writable('')
const createTask = () => {
  kernel.createTask($title)
    .then(taskId => {
      console.info('Created task, successfully:', taskId.toString('hex'))
      $title = ''
    })
    .catch(error => {
      console.error('Failed creating task:', error)
    })
}

// Update task
const options = ['todo', 'in-progress', 'to-verify', 'done', 'wontfix']
const updateStatus = (id, status) => {
  kernel.setStatus(id, status)
    .then(() => console.info('Updated status successfully'))
    .catch(error => {
      console.error('Update status failed:', error)
    })
}
</script>
<div>
  <h3>LiveDemo: todolist</h3>
  <p>Peers: {$connections}</p>
  <br/>
  <div class="grid">
    <div><input type="text" bind:value={$title} placeholder="Take a walk"/></div>
    <div><button on:click={createTask}>Add task</button></div>
  </div>
  <section class="tasks">
    {#each $tasks as task}
      <task>
        <strong>{task.title}</strong>
        <div>
          {#each options as status}
            <btn on:click={() => updateStatus(task.id, status)}
                class:inverse={status !== task.status}>
              {status}
            </btn>
          {/each}
        </div>
        <p>
          Author: <samp>{task.author?.toString('hex').slice(0, 8)}</samp>
          <br/>
          Updated: <samp>{new Date(task.updated).toLocaleString()}</samp>
        </p>
      </task>
    {/each}
  </section>
</div>
<style>
  task {
    display: inline-block;
    max-width: 400px;
    margin-right: 1em;
    margin-bottom: 1em;
    padding: 0.5em 1em 0 1em;
    border: var(--border-width) solid var(--form-element-border-color);
    border-radius: var(--border-radius);
  }
  .tasks { min-height: 6em; }
</style>
