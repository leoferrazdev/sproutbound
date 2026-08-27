export function createGamePixProfile(version) {
  const prefix = `sproutbound-quality-${version}-gamepix`;
  return {
    platform: 'gamepix',
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
