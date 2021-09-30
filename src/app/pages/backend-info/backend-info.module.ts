import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BackendInfoPageRoutingModule } from './backend-info-routing.module';

import { BackendInfoPage } from './backend-info.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BackendInfoPageRoutingModule
  ],
  declarations: [BackendInfoPage]
})
export class BackendInfoPageModule {}
