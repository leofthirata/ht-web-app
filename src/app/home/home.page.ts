/// <reference types="web-bluetooth" />

import { Component } from '@angular/core';
import { BluetoothService } from './ble/ble';
import { WebSocketService } from './websocket/ws'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {

  constructor() {}
    public async test() {
    const socket = new WebSocketService();
    await socket.open('ws://localhost:8080');
    socket.send('bbbbbbbbbbbbbbbbbbb');
    console.log("oi");
    const bleClient = new BluetoothService('7C9EBDD71678');
    await bleClient.find();
    await bleClient.connect();
    await bleClient.getService();
    await bleClient.getCharacteristics();
    await bleClient.scanWifi();
    // await bleClient.listen();
    // await bleClient.disconnect();
    console.log("oi");
  }
}
