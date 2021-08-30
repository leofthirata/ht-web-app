import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SerialPage } from './serial.page';

const routes: Routes = [
  {
    path: '',
    component: SerialPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SerialPageRoutingModule {}
