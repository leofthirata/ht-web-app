/// <reference types="web-bluetooth" />

import { Component } from '@angular/core';
import { BluetoothService } from './services/ble/ble';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {
  private m_ble: BluetoothService;
  public deviceSelected = false;
  public product = "ONE";
  public wifiSsid = "PADOTEC";
  public wifiPassword = "P@d0t3c2021";
  public bleMac = "7C9EBDD71678";

  constructor(private nav: NavController) {}

  public async deviceSelectionOnClick() {
    this.m_ble = new BluetoothService(this.bleMac);
    this.deviceSelected = true;
    await this.m_ble.find();
    await this.m_ble.connect();
    await this.m_ble.getService();
    await this.m_ble.getCharacteristics();
    console.log(this.wifiSsid);
    console.log(this.wifiPassword);
    console.log(this.product);
  }

  //TODO: disconnect after getting IP
  public async scanWifiOnClick() {
    console.log(this.m_ble);
    await this.m_ble.scanWifi(15);
  }

  public async findMeOnClick() {
    await this.m_ble.findMe();
  }

  public async connectToWifiOnClick() {
    await this.m_ble.connectToWifi(this.wifiSsid, this.wifiPassword);
    this.nav.navigateForward('authentication', { state: this.m_ble.getIp() });
  }
}
