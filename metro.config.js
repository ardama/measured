const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = (async () => {
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