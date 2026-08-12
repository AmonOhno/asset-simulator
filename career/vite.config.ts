import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');

  return {
    plugins: [react()],
    resolve: {
      // 実行時は shared のソースを直接参照する（client / mobile と同じ方針）
      alias: {
        '@asset-simulator/shared': path.resolve(
          __dirname,
          '../packages/shared/src/index.ts'
        ),
      },
      dedupe: ['react', 'react-dom', 'zustand'],
    },
    define: {
      'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(
        env.REACT_APP_SUPABASE_URL
      ),
      'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(
        env.REACT_APP_SUPABASE_ANON_KEY
      ),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      fs: { allow: ['..'] },
    },
    build: {
      outDir: 'dist',
    },
  };
});
