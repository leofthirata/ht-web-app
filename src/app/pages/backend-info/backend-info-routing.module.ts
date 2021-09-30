import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BackendInfoPage } from './backend-info.page';

const routes: Routes = [
  {
    path: '',
    component: BackendInfoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BackendInfoPageRoutingModule {}
