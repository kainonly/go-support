import { Component } from '@angular/core';

import { AppService } from '@app';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-index-overview',
  templateUrl: './overview.component.html'
})
export class OverviewComponent {
  constructor(
    public app: AppService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {}
}
