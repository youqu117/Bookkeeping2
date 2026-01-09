
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 因为你的仓库名是 Bookkeeping2，部署后路径通常是 /Bookkeeping2/
  // 使用 './' 可以让它在任何子路径下都能正确找到资源
  base: './', 
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts', 'lucide-react']
        }
      }
    }
  }
});
