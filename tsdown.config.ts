import { defineConfig } from 'tsdown';
import path from 'path';

export default defineConfig({
  entry: ['./src/index.ts'],
  inputOptions: {
    resolve: {
      extensions: ['.ts', '.d.ts', '.js', '.json'],
      alias: {
        src: path.resolve(process.cwd(), 'src'),
      },
    },
  },
});
