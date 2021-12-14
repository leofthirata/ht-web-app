import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SerialPageRoutingModule } from './serial-routing.module';

import { SerialPage } from './serial.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SerialPageRoutingModule
  ],
  declarations: [SerialPage]
})
export class SerialPageModule {}
