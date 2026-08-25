import { createApp } from './app.js';
import { createGameDistributionAdapter } from './platform-adapters/gamedistribution.js';

if (typeof window !== 'undefined' && window.document) {
  createApp(window.document, {
    platformAdapterFactory: createGameDistributionAdapter,
  });
}
