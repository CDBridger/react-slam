import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    }),
    dts({ rollupTypes: true })
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'React Slam',
      fileName: (format) => `react-slam.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'matter-js'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'matter-js': 'matter-js',
        },
      },

    }
  }
})
