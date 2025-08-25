// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

// Récupère la configuration par défaut d'Expo Metro
const config = getDefaultConfig(__dirname);

/**
 * Middleware personnalisé pour forcer le HMR sur ton IP locale
 * Remplace l'adresse par l'IP de ton poste de travail ou de ton émulateur
 */
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware, server) => {
  server._config.hmrHost = '192.168.137.34';
  return middleware;
};

/**
 * Alias pour résoudre le problème d'asset manquant dans @react-navigation/elements
 */
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'missing-asset-registry-path': require.resolve(
    'react-native/Libraries/Image/AssetRegistry'
  ),
};

module.exports = config;
