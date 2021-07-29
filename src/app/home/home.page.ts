/// <reference types="web-bluetooth" />

import { Component, ElementRef, ViewChild } from '@angular/core';
import { BluetoothService } from './services/ble/ble';
import { NavController, AlertController } from '@ionic/angular';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {
  @ViewChild('terminal1') terminal: ElementRef;
  @ViewChild('terminal2') terminal2: ElementRef;

  private m_ble: BluetoothService;
  public deviceSelected = false;
  public product = "ONE";
  public wifiSsid = "Hausenn";
  public wifiPassword = "9@.2da!fc7";
  public bleMac = "7C9EBDD71678";

  private term = new Terminal();
  private term2 = new Terminal();

  constructor(private nav: NavController, private alertController: AlertController) {}

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

  public ionViewDidEnter() {
    const fitAddon = new FitAddon();
    this.term.loadAddon(fitAddon);
    this.term.open(this.terminal.nativeElement);
    fitAddon.fit();

    const fitAddon2 = new FitAddon();
    this.term2.loadAddon(fitAddon2);
    this.term2.open(this.terminal2.nativeElement);
    fitAddon2.fit();

    window.onresize = () => {
      fitAddon.fit();
      fitAddon2.fit();
    };
  }

  async presentAlertPrompt() {
    const alert = await this.alertController.create({
      header: 'Wi-Fi Configuration',
      inputs: [
        {
          name: 'ssid',
          type: 'text',
          value: this.wifiSsid,
          placeholder: 'Enter ssid'
        },
        {
          name: 'pswd',
          type: 'text',
          value: this.wifiPassword,
          placeholder: 'Enter password'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Ok',
          handler: ans => {
            this.wifiSsid = ans.ssid;
            this.wifiPassword = ans.pswd;
            this.connectToWifiOnClick()          
          }
        }
      ]
    });

    await alert.present();
  }
}
