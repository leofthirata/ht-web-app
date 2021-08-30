import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WebsocketPageRoutingModule } from './websocket-routing.module';

import { WebsocketPage } from './websocket.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WebsocketPageRoutingModule
  ],
  declarations: [WebsocketPage]
})
export class WebsocketPageModule {}
