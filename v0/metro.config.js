import { getDefaultConfig } from '@react-native/metro-config';

export default (async () => {
  const config = await getDefaultConfig(__dirname);
  const { assetExts } = config.resolver;

  return {
    ...config,
    resolver: {
      ...config.resolver,
      assetExts: [...assetExts, 'pem'],
    },
  };
})();