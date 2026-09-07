/// <reference types="vite/client" />

/** بصمة الإصدار — تُستبدل وقت البناء عبر define في vite.config.ts (تُكتب أيضًا في /version.json) */
declare const __BUILD_ID__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
