import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

/** بصمة إصدار فريدة لكل عملية build — تُدمج في الكود وتُنشر في /version.json
 *  ليكتشف المتصفح (chunkRecovery.ts) أنه يشغّل نسخة قديمة ويحدّث نفسه تلقائيًا */
const BUILD_ID = Date.now().toString(36);

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'hassty-version-stamp',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'version.json',
            source: JSON.stringify({ buildId: BUILD_ID, builtAt: new Date().toISOString() }, null, 2),
          });
        },
      },
    ],
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
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
            // HomePage bundle منفصلة عن باقي الصفحات العامة — باقي الصفحات تُحمَّل عند الطلب فقط
            if (id.endsWith('/src/pages/HomePage.tsx')) return 'app-home';
            // أقسام صفحة الهبوط السفلية — تُحمَّل عند الطلب (lazy) ولا تُثقل التحميل الأولي
            if (id.includes('/src/components/ProblemSolutionSection') || id.includes('/src/components/HowItWorksSection') || id.includes('/src/components/FindTutorStepsSection') || id.includes('/src/components/SubjectsSection') || id.includes('/src/components/AccountTypesSection') || id.includes('/src/components/FeaturesSection') || id.includes('/src/components/TeacherCTASection') || id.includes('/src/components/PlatformProofSection') || id.includes('/src/components/FAQSection')) return 'app-landing';
            // ===== Lazy app feature groups (only fetched on demand) =====
            if (id.includes('/src/pages/admin/')) return 'app-admin';
            if (id.includes('/src/pages/teacher/')) return 'app-teacher';
            // أدوار منفصلة: ولي الأمر لا يحمّل كود الطلاب/المساعدين والعكس — حزم أصغر
            // أقل عرضة لفشل التحميل على شبكات ضعيفة (كانت حزمة واحدة app-roles سابقًا)
            if (id.includes('/src/pages/student/')) return 'app-student';
            if (id.includes('/src/pages/parent/')) return 'app-parent';
            if (id.includes('/src/pages/assistant/')) return 'app-assistant';
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
