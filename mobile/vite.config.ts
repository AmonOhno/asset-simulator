import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // shared パッケージの CJS dist ではなくソース TS を直接参照し、Vite で変換する
        '@asset-simulator/shared': path.resolve(__dirname, '../packages/shared/src/index.ts'),
      },
    },
    define: {
      // shared パッケージが process.env.REACT_APP_* を参照するため、Vite 用にマッピング
      'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL),
      'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(env.REACT_APP_SUPABASE_ANON_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      port: 5173,
    },
  };
});
