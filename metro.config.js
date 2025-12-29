// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude Android build directories from Metro's file watcher
// This prevents errors when directories don't exist for all architectures
config.watchFolders = config.watchFolders || [];
config.resolver = config.resolver || {};
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  // Block Android build directories
  /android\/app\/build\/.*/,
  /android\/\.cxx\/.*/,
];

module.exports = config;

