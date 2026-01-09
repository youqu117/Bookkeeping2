
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 这里的 base 必须对应你的 GitHub 仓库名，通常是 /仓库名/
  base: './', 
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
