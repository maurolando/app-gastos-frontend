import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// Solución al bug crítico de Apollo Client en Angular 15
(window as any).__DEV__ = true;

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
