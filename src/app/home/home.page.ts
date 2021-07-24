/// <reference types="web-bluetooth" />

import { Component } from '@angular/core';
import { BluetoothService } from './services/ble/ble';
import { WebSocketService } from './services/websocket/ws'
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {
  private m_ble: BluetoothService;
  public deviceSelected = false;

  constructor(private nav: NavController) {}

  public async deviceSelectionOnClick() {
    this.m_ble = new BluetoothService('7C9EBDD71678');
    this.deviceSelected = true;
  }

  public async scanWifiOnClick() {
    await this.m_ble.find();
    await this.m_ble.connect();
    await this.m_ble.getService();
    await this.m_ble.getCharacteristics();
    await this.m_ble.findMe();
    await this.m_ble.disconnect();
  }

  public async findMeOnClick() {
    await this.m_ble.find();
    await this.m_ble.connect();
    await this.m_ble.getService();
    await this.m_ble.getCharacteristics();
    await this.m_ble.findMe();
    await this.m_ble.disconnect();
  }

  public async connectToWifiOnClick() {
    await this.m_ble.find();
    await this.m_ble.connect();
    await this.m_ble.getService();
    await this.m_ble.getCharacteristics();
    await this.m_ble.connectToWifi('Leo', '12079412');
    this.pushToNextScreenWithParams('testing', this.m_ble.getIp());
    await this.m_ble.disconnect();
  }

  private pushToNextScreenWithParams(pageUrl: any, params: any) {
    this.nav.navigateForward(pageUrl, { state: params });
  }
}
