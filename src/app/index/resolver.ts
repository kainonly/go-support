import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';

import { AppService } from '@app';
import { Any, AnyDto } from '@weplanx/ng';

export const resolver: ResolveFn<AnyDto<Any>> = (route: ActivatedRouteSnapshot) => {
  const app = inject(AppService);
  app.context = route.params['namespace'];
  return app.fetchContextData();
};
