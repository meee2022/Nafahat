const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  {
    ignores: [
      '**/dist/**',
      '**/dist-android-check/**',
      '**/dist-ios-offline/**',
      '**/convex/_generated/**',
      '**/assets/**',
    ],
  },
  ...expoConfig,
  {
    rules: {
      // React Native Animated values intentionally live in refs and are read by Animated styles.
      'react-hooks/refs': 'off',
      // These compiler-oriented rules currently flag established React Native state/effect patterns.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react/no-unescaped-entities': 'warn',
    },
  },
]);
