const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

module.exports = {
  projectRoot: __dirname,
  watchFolders: [repoRoot],
  resolver: {
    sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json'],
    unstable_enablePackageExports: true,
    nodeModulesPaths: [
      path.join(__dirname, 'node_modules'),
      path.join(repoRoot, 'node_modules'),
    ],
  },
  transformer: {
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  },
};
