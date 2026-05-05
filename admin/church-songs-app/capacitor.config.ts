import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.churchsongs.app',
  appName: 'ውሉደ ያሬድ ዜማ PRO',
  webDir: 'public',

  server: {
    url: 'https://church-songs-app-git-admin-mobile-alazar-das-projects.vercel.app/login/',
    cleartext: true
  }
};

export default config;