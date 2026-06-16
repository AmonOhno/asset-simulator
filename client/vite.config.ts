import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@asset-simulator/shared': path.resolve(__dirname, '../packages/shared/src/index.ts'),
        '@web': path.resolve(__dirname, '../web/src/'),
        '@mobile': path.resolve(__dirname, '../web-new/playground/src/'),
        '@mobile-components': path.resolve(__dirname, '../web-new/src/components/'),
      },
      dedupe: ['react', 'react-dom', 'zustand'],
    },
    define: {
      'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL),
      'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(env.REACT_APP_SUPABASE_ANON_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      fs: { allow: ['..'] },
    },
    build: {
      outDir: 'dist',
    },
  }
})
