import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // ===== Vendors: stable libs, cached separately from app code =====
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('scheduler')) return 'vendor-react';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'vendor-charts';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('motion') || id.includes('framer')) return 'vendor-motion';
              if (id.includes('qrcode') || id.includes('jsbarcode') || id.includes('jsqr') || id.includes('html-to-image')) return 'vendor-qr';
              if (id.includes('@google/genai')) return 'vendor-ai';
              return 'vendor-misc';
            }
            // App entry stays in the index chunk (avoids shell<->public circular chunk)
            if (id.endsWith('/src/App.tsx') || id.endsWith('/src/main.tsx')) return;
            // ===== Lazy app feature groups (only fetched on demand) =====
            if (id.includes('/src/pages/admin/')) return 'app-admin';
            if (id.includes('/src/pages/teacher/')) return 'app-teacher';
            if (id.includes('/src/pages/student/') || id.includes('/src/pages/parent/') || id.includes('/src/pages/assistant/')) return 'app-roles';
            if (id.includes('/src/pages/')) return 'app-public';
            // role-only components follow their role chunks
            if (id.includes('/src/components/teacher/')) return 'app-teacher';
            if (id.includes('/src/components/admin/')) return 'app-admin';
            // QR/card tooling is heavy: only loaded by teacher scan & student card (both lazy)
            if (id.includes('/src/components/RealQRCameraScanner') || id.includes('/src/components/QRCardSimulatorModal') || id.includes('/src/components/StudentCardRenderer') || id.includes('/src/components/StudentCardDesigner')) return 'app-qr';
            if (id.includes('/src/utils/qrImageGenerator') || id.includes('/src/utils/studentCardExporter')) return 'app-qr';
            // ===== Shared app shell: auth, design system, services (needed on every route) =====
            if (id.includes('/src/')) return 'app-shell';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
