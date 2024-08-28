import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native-web/Libraries/Utilities/codegenNativeComponent': 'react-native-web/Libraries/Utilities/codegenNativeComponent',
      'react-native-vector-icons': 'react-native-vector-icons/dist',
      'react-native': 'react-native-web',
      '@component': path.resolve(__dirname, './src/components'),
      '@type': path.resolve(__dirname, './src/types'),
      '@s': path.resolve(__dirname, './src/store'),
      '@': path.resolve(__dirname, './src'),
      // 'react-native-safe-area-context': 'react-native-safe-area-context/lib/module/web',
    },
  },
  define: {
    'process.env': {},
  },
  esbuild: {
    loader: { '.js': 'jsx' },
    include: /\.(jsx|js)$/,
  },
});