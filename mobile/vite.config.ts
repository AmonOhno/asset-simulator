import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    root: 'playground',
    publicDir: 'playground/public',
    plugins: [react()],
    resolve: {
      alias: {
        // shared パッケージの CJS dist ではなくソース TS を直接参照し、Vite で変換する
        '@asset-simulator/shared': path.resolve(__dirname, '../packages/shared/src/index.ts'),
      },
      // packages/shared の node_modules に別の React が存在する場合に2インスタンス化を防ぐ
      dedupe: ['react', 'react-dom', 'zustand'],
    },
    define: {
      // shared パッケージが process.env.REACT_APP_* を参照するため、Vite 用にマッピング
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
