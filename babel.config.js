module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@features': './src/features',
            '@theme': './src/theme',
            '@store': './src/store',
            '@data': './src/data',
            '@utils': './src/utils',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@constants': './src/constants',
            '@types': './src/types',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
