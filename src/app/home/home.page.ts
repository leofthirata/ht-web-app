/// <reference types="web-bluetooth" />

import { Component } from '@angular/core';
import { BluetoothService } from './services/ble/ble';
import { WebSocketService } from './services/websocket/ws'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {

  constructor() {}
    public async test() {
    console.log("oi");
    const bleClient = new BluetoothService('7C9EBDD71678');
    await bleClient.find();
    await bleClient.connect();
    await bleClient.getService();
    await bleClient.getCharacteristics();
    await bleClient.scanWifi(15);
    console.log("oi");
  }
}
