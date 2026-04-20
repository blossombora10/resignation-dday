import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'resignation-dday',
  brand: {
    displayName: '퇴사 디데이',
    primaryColor: '#6366F1',
    icon: '',
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
