const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure that all platforms are enabled
config.resolver.platforms = ['android', 'ios', 'web'];

module.exports = config;
