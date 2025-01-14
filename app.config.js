import 'dotenv/config';

export default ({ config }) => {
  // Check if running any EAS command by looking at argv
  const isEasCommand = process.argv.some(arg => arg.includes('eas'));
  
  // Use isEasCommand instead of EAS_BUILD check
  const isEasBuild = isEasCommand;
  
  // Get variables from either .env or EAS secrets
  const getEnvVar = (name) => {
    if (isEasBuild) {
      // During EAS build, secrets will be injected as env vars
      return process.env[name] || 'placeholder-for-eas-build';
    }
    // During local development, read from .env
    return process.env[name];
  };

  // Only validate env vars during local development
  if (!isEasBuild) {
    console.log('Validating environment variables for local development...');
    const requiredVars = [
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required variables:', missingVars);
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }
  } else {
    console.log('Skipping environment validation for EAS build');
  }

  const finalConfig = {
    expo: {
      ...config,
      extra: {
        ...config.extra,
        FIREBASE_API_KEY: getEnvVar('FIREBASE_API_KEY'),
        FIREBASE_AUTH_DOMAIN: getEnvVar('FIREBASE_AUTH_DOMAIN'),
        FIREBASE_PROJECT_ID: getEnvVar('FIREBASE_PROJECT_ID'),
        FIREBASE_STORAGE_BUCKET: getEnvVar('FIREBASE_STORAGE_BUCKET'),
        FIREBASE_MESSAGING_SENDER_ID: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
        FIREBASE_APP_ID: getEnvVar('FIREBASE_APP_ID'),
        FIREBASE_MEASUREMENT_ID: getEnvVar('FIREBASE_MEASUREMENT_ID'),
      },
    },
  };

  return finalConfig;
}; 