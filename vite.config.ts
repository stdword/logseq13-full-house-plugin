import { defineConfig } from 'vite'
import logseqDevPlugin from 'vite-plugin-logseq'


export default defineConfig(({ command, mode, ssrBuild }) => {
  const forProd = mode === 'production'

  return {
    plugins: [
      // Makes HMR available for development
      logseqDevPlugin()
    ],
    build: {
      sourcemap: !forProd,
      target: 'esnext',
      minify: forProd ? 'esbuild' : false,
    },
  }
})
