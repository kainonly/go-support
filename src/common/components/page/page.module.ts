import { NgModule } from '@angular/core';

import { BlankPageComponent } from '@common/components/page/blank-page.component';
import { ShareModule } from '@common/share.module';

@NgModule({
  imports: [ShareModule],
  declarations: [BlankPageComponent],
  exports: [BlankPageComponent]
})
export class PageModule {}
