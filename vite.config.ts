import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(
      process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || ''
    ),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(
      process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || ''
    ),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(
      process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || ''
    ),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(
      process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || ''
    ),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || ''
    ),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(
      process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || ''
    ),
  },
})
