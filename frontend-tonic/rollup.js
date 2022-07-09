import polyfills from 'rollup-plugin-node-polyfills'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import livereload from 'rollup-plugin-livereload'
// import { terser } from 'rollup-plugin-terser'
const production = !process.env.ROLLUP_WATCH

export default {
  input: 'main.js',
  output: {
    sourcemap: true, // !production, costs about ~2MB
    format: 'iife',
    name: 'app',
    file: 'pub/build/main.js'
  },
  plugins: [
    resolve({
      browser: true,
      dedupe: ['sodium-universal'],
      preferBuiltins: false
    }),
    commonjs(),
    polyfills({ sourceMap: true, include: ['buffer'] }),
    !production && serve(),
    !production && livereload('pub/')
    // production && terser()
  ],
  watch: {
    clearScreen: false
  }
}

function serve () {
  let server

  function toExit () {
    if (server) server.kill(0)
  }

  return {
    writeBundle () {
      if (server) return
      server = require('child_process').spawn('$(npm bin)/sirv',
        [
          'pub/', '--dev', '--host 0.0.0.0', '--port 5000'
        ],
        {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true
        })

      process.on('SIGTERM', toExit)
      process.on('exit', toExit)
    }
  }
}
