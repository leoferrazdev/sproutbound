export function createCrazyGamesProfile(version) {
  const prefix = `sproutbound-quality-${version}-crazygames`;
  return {
    platform: 'crazygames',
    entrypoint: 'src/main.js',
    externalUrls: [],
    outputDirectory: `${prefix}-build`,
    zipFile: `${prefix}.zip`,
    removePaths: [
      'src/main-gamedistribution.js',
      'src/platform-adapters',
    ],
  };
}
