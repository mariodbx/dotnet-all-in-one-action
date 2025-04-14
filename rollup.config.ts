// rollup.config.ts
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  // Explicitly prevent treating any modules as external.
  external: [],
  plugins: [
    // Resolve modules from node_modules
    nodeResolve({ preferBuiltins: true }),
    // Convert CommonJS modules to ES6, so they can be included in a Rollup bundle
    commonjs(),
    // Allow Rollup to import JSON files if needed
    json(),
    // Compile TypeScript to JavaScript
    typescript()
  ]
}

export default config
