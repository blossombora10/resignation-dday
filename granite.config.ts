import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'resignation-dday',
  brand: {
    primaryColor: '#6366F1',
    icon: 'https://resignation-dday.vercel.app/icon.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
});