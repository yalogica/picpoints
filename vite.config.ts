import { defineConfig } from 'vite';
import { resolve } from 'path';
import { name, version } from './package.json';
import dts from 'vite-plugin-dts';

const replacement = (config) => {
  const replace = (code) => {
    config && config.forEach((option) => {
      if ( (typeof option.from === 'string' || option.from instanceof RegExp) === false ) {
        throw new Error(`[vite-plugin-replacement]: The replacement option 'from' is not of type 'string' or 'RegExp'.`);
      } else if ( (typeof option.to === 'string' || option.to instanceof Function) === false ) {
        throw new Error(`[vite-plugin-replacement]: The replacement option 'to' is not of type 'string' or 'Function'`);
      } else {
        code = code.replace(option.from, option.to as string); // W3C - Function is allowed!
      }
    });
    return code;
  }

  return {
    name: 'vite-replacement-plugin',
    transform(code) {
      return {
        code: replace(code),
        map: null
      };
    }
  }
} 

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    build: {
      sourcemap: true,
      minify: !isDev,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: name,
        fileName: (format) => `index.${format}.js`,
        formats: ['es', 'umd'],
      },
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if(assetInfo.names.some(name => name.endsWith('.css'))) {
						  return 'index.css'
            }
            return `[name][extname]`;
					}
        }
      }
    },
    plugins: [
      replacement([
        { from: '@@version', to: version },
        { from: '@@date', to: new Date().toDateString() }
      ]),
      dts({
        outDir: 'dist/types'
      })
    ]
  }
});