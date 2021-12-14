import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CoredumpPage } from './coredump.page';

const routes: Routes = [
  {
    path: '',
    component: CoredumpPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CoredumpPageRoutingModule {}
