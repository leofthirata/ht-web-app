import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CoredumpPageRoutingModule } from './coredump-routing.module';

import { CoredumpPage } from './coredump.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CoredumpPageRoutingModule
  ],
  declarations: [CoredumpPage]
})
export class CoredumpPageModule {}
