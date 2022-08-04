[`pure | 📦`](https://github.com/telamon/create-pure)
[`code style | standard`](https://standardjs.com/)

# pico-template

This is a [pico-stack](https://github.com/telamon/picostack) project template
containing a minimal 'todo'-app using svelte
as template engine.

(You can hack it to use any other framework/template engine if you want, svelte was just what i had lying around.)

[DEMO](https://pico-todo.surge.sh/)

## module `pico-todo-kernel`
The `production` branch of this project surged ahead and a full todo-app
is currently being produced.

This kernel is published on npm
Here's the current API to use it:
```bash
npm i --save pico-todo-kernel browser-level pico-stack piconuro
```

```js
import Kernel from 'pico-todo-kernel'
import { BrowserLevel } from 'browser-level' // or 'level' for node

// --- Bootloader
const database = new BrowserLevel('myTodo', { valueEncoding: 'buffer' })

export const kernel = new Kernel(database)

await kernel.boot()

// --- Reading state

kernel.$connections(conn => {
  document.findElementById('peers').innerText = conn.length
})

kernel.$tasks(tasks => {
  const elem = document.findElementById('tasks')
  let html = ''
  for (const task of tasks) {
    html += `<li>${task.title}</li>`
  }
  elem.innerHTML = html
})

// --- Writing state

// new task
const taskId = await kernel.createTask('Water plants')

// modify status 'todo|in-progress|to-verify|done|wontfix'
await kernel.setStatus(taskId, 'in-progress')

// assign to other user
await kernel.assign(taskId, daphnePublicKey)

// note: it's currently set automatically return original ownership
// of task if other user sets status to either 'to-verify|done|wontfix'
```

Let me know if i can change/improve it.

## Getting started

Create your project if you already haven't

```bash
npx degit telamon/pico-template my-project
```

Then start the local dev-server

```bash
yarn
yarn dev
```

and navigate to [https://localhost:5000](https://localhost:5000)

Other included scripts:

```bash
yarn dev    # Starts local dev-server
yarn test   # Blockend dev: runs unit tests
yarn debug  # Blockend dev: debugs unit tests
yarn build  # Builds production webapp
yarn sinal  # Starts a local swarm singaling server
yarn surge  # Publishes your app to surge.sh
```

## Donations

```ad
|  __ \   Help Wanted!     | | | |         | |
| |  | | ___  ___ ___ _ __ | |_| |     __ _| |__  ___   ___  ___
| |  | |/ _ \/ __/ _ \ '_ \| __| |    / _` | '_ \/ __| / __|/ _ \
| |__| |  __/ (_|  __/ | | | |_| |___| (_| | |_) \__ \_\__ \  __/
|_____/ \___|\___\___|_| |_|\__|______\__,_|_.__/|___(_)___/\___|

If you're reading this it means that the docs are missing or in a bad state.

Writing and maintaining friendly and useful documentation takes
effort and time.


  __How_to_Help____________________________________.
 |                                                 |
 |  - Open an issue if you have questions!         |
 |  - Star this repo if you found it interesting   |
 |  - Fork off & help document <3                  |
 |  - Say Hi! :)  https://discord.gg/8RMRUPZ9RS    |
 |.________________________________________________|
```

## License

[AGPL-3.0-or-later](./LICENSE)

2022 &#x1f12f; Tony Ivanov
