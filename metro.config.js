const path = require('path');
const polyfillPath = path.join(__dirname, 'scripts', 'node18-polyfill.js');

// Require Node 18 ECMAScript 2023 polyfills in main Metro process
require(polyfillPath);

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Run transformations in single worker to ensure polyfills persist across transformer instances on Node 18
config.maxWorkers = 1;

module.exports = config;
