import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';

export default {
  input: 'src/airport-card.ts', // Path to your entry point file
  output: {
    file: 'dist/airport-card.js', // Output bundled file
    format: 'es', // Use ES Module format
  },
  plugins: [
    json(), // Include JSON files in the bundle
    resolve(),
    typescript(),
    terser() // Minify the output for better performance in production
  ]
};
