import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    root: 'app',
    publicDir: 'app/public',
    plugins: [react()],
    resolve: {
      alias: {
        '@asset-simulator/shared': path.resolve(__dirname, '../packages/shared/src/index.ts'),
        '@mobile-components': path.resolve(__dirname, './components'),
      },
      dedupe: ['react', 'react-dom', 'zustand'],
    },
    define: {
      'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL),
      'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(env.REACT_APP_SUPABASE_ANON_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
  }
})
