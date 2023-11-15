import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NavModule } from '@common/components/nav/nav.module';
import { ShareModule } from '@common/share.module';

import { AdminComponent } from './admin.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
        data: {
          breadcrumb: `Dashboard`
        }
      },
      {
        path: 'properties',
        loadChildren: () => import('./properties/properties.module').then(m => m.PropertiesModule),
        data: {
          breadcrumb: `Dashboard`
        }
      },
      {
        path: 'datasets',
        loadChildren: () => import('./datasets/datasets.module').then(m => m.DatasetsModule),
        data: {
          breadcrumb: `Dataset`
        }
      },
      {
        path: 'users',
        loadChildren: () => import('./users/users.module').then(m => m.UsersModule),
        data: {
          breadcrumb: `Users`
        }
      },
      {
        path: 'integrated',
        loadChildren: () => import('./integrated/integrated.module').then(m => m.IntegratedModule),
        data: {
          breadcrumb: `Integrated`
        }
      },
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule),
        data: {
          breadcrumb: `Setting`
        }
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [ShareModule, NavModule, RouterModule.forChild(routes)],
  declarations: [AdminComponent]
})
export class AdminModule {}
