export const gameDistributionSdkUrl = 'https://html5.api.gamedistribution.com/main.min.js';

export function createGameDistributionProfile(version) {
  const prefix = `sproutbound-quality-${version}-gamedistribution`;
  return {
    platform: 'gamedistribution',
    entrypoint: 'src/main-gamedistribution.js',
    externalUrls: [gameDistributionSdkUrl],
    outputDirectory: `${prefix}-build`,
    zipFile: `${prefix}.zip`,
    removePaths: [],
  };
}
