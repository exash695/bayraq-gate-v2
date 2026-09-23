const config = {
  appId: 'com.bairaq.gate6',
  appName: 'بوابة بيرق - Bayraq Gate',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'bairaq-iq.com',
      '*.bairaq-iq.com',
      'api.bairaq-iq.com'
    ]
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#020617'
  }
};

export default config;
