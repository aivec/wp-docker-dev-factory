import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  inputOptions: {
    resolve: {
      extensions: ['.ts', '.d.ts', '.js', '.json'],
    },
  },
});
