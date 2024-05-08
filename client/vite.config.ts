import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    // Setup to resolve TypeScript and JS files
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 8080, // Default is 3000, but you can specify any port
    strictPort: true, // If the port is already in use, Vite will exit instead of trying another port
  },
  build: {
    // Build specific configurations
  }
});
