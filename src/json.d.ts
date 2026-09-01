declare module '../firebase-applet-config.json' {
  const value: {
    projectId: string;
    appId: string;
    apiKey: string;
    authDomain: string;
    firestoreDatabaseId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    measurementId?: string;
    oAuthClientId?: string;
  };
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}
