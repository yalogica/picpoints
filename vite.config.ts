import { defineConfig } from 'vite';
import fs from 'fs'
import path, { resolve } from 'path';
import * as sass from 'sass';
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
        name: 'vite-plugin-replacement',
        transform(code) {
            return {
                code: replace(code),
                map: null
            };
        }
    }
};

const scss = (config: { input: string | string[]; output: string; sourceMap?: boolean; minify?: boolean; }) => {
    return {
        name: 'vite-plugin-scss-compile',
        closeBundle() {
            const files = Array.isArray(config.input) ? config.input : [config.input];

            files.forEach(file => {
                try {
                    const result = sass.compile(file, {
                        sourceMap: config.sourceMap,
                        loadPaths: [path.dirname(file)]
                    });
              
                    if (!fs.existsSync(config.output)) {
                        fs.mkdirSync(config.output, { recursive: true });
                    }
              
                    const outputFile = resolve(
                        config.output, 
                        path.basename(file).replace('.scss', '.css')
                    );
              
                    fs.writeFileSync(outputFile, result.css);
                    console.log(`✅ SCSS compiled: ${path.basename(file)} → ${path.basename(outputFile)}`);
                } catch (error) {
                    console.error(`❌ Failed to compile ${file}:`, error);
                }
            });
        },
    };
};

export default defineConfig(({ mode }) => {
    const isDev = mode === 'development';

    return {
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
            }
        },
        build: {
            minify: !isDev,
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                name: name,
                fileName: (format) => `index.${format}.js`,
                formats: ['es', 'umd'],
            }
        },
        plugins: [
            replacement([
                { from: '@@version', to: version },
                { from: '@@date', to: new Date().toDateString() }
            ]),
            scss({
                input: [
                    resolve(__dirname, 'src/animate.scss'),
                    resolve(__dirname, 'src/styles.scss'),
                ],
                output: resolve(__dirname, 'dist')
            }),
            dts({
                outDir: 'dist/types'
            })
        ]
    }
});