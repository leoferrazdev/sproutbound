import { createApp } from './app.js';
import { createPlatformAdapter } from './platform-adapter.js';
export { createApp } from './app.js';

if (typeof window !== 'undefined' && window.document) {
  createApp(window.document, { platformAdapterFactory: createPlatformAdapter });
}
