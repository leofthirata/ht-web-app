/// <reference types="web-bluetooth" />
/// <reference types="w3c-web-serial" />

import { Component, ElementRef, ViewChild } from '@angular/core';
import { BluetoothService } from './services/ble/ble';
import { NavController, AlertController } from '@ionic/angular';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Cast } from './utils/cast';
import * as Colors from './utils/color';

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
  public wifiSsid = "PADOTEC";
  public wifiPassword = "P@d0t3c2021";
  public bleMac = "7C9EBDD71678";

  private term = new Terminal();
  private term2 = new Terminal();

  private devPort!: SerialPort;
  private devConnected = false;

  constructor(private nav: NavController, private alertController: AlertController) {
    navigator.serial.addEventListener('disconnect', (event) => {
      const port = event.target as SerialPort;
      console.log('Port disconnected', port);

      if (port === this.devPort) {
        this.devConnected = false;
      }
    });

  }

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

  async wifiConfigAndConnectOnClick() {
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

  public async onConnectDevice() {
    this.devPort = await this.open(24592, 1027);

    if (this.devPort) {
      this.devConnected = true;
    }

    this.readUntilClosed();
  }

  async readUntilClosed() {
    let keepReading = true;
    let reader;
    let buffer: number[] = [];

      reader = this.devPort.readable.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            // |reader| has been canceled.
            break;
          } else {
            buffer = Array.from(value);
            const str = Cast.bytesToString(new Uint8Array(buffer));
            this.term2.write(str);
          }
          // Do something with |value|...
        }
      } catch (error) {
        // Handle |error|...
      } finally {
        reader.releaseLock();
      }

    await this.devPort.close();
  }

  public async onDisconnectDevice() {
    await this.close(this.devPort);
    this.devConnected = false;
  }

  private async open(pid: number, vid: number): Promise<SerialPort> {
    try {
      const port = await navigator.serial.requestPort({
        filters: [{ usbProductId: pid, usbVendorId: vid }],
      });

      await port.open({ baudRate: 115200, bufferSize: 4096, flowControl: 'none' });

      return port;
    } catch (error) {
      this.logError(error);
      return null;
    }
  }

  private async close(port: SerialPort): Promise<void> {
    if (port) {
      await port.close();
      port = null;
    }
  }

  private async send(port: SerialPort, data: number[]): Promise<void> {
    const writter = await port.writable.getWriter();

    try {
      await writter.write(new Uint8Array(data));
    } finally {
      writter.close();
    }
  }

  private recv(port: SerialPort): Promise<number[]> {
    return new Promise<number[]>(async (res, rej) => {
      const reader = await port.readable.getReader();

      const timeout = setTimeout(() => {
        reader.cancel();
        reader.releaseLock();
        rej('timeout waiting for response');
      }, 3000);

      let buffer: number[] = [];
      
      try {
        const { value } = await reader.read();
        if (value) {
          buffer = Array.from(value);
        }
      } finally {
        reader.releaseLock();
        clearTimeout(timeout);
      }

      if (port === this.devPort) {
        const str = Cast.bytesToString(new Uint8Array(buffer));
        this.term2.write(str);
      }

      res(buffer);
    });
  }

  private logError(error: any) {
    let text: string;

    if (typeof error === 'string') {
      text = error;
    } else if (error?.message) {
      text = error.message;
    } else {
      text = 'Unknown error';
    }

    this.term.writeln(Colors.red + '[ERROR] ' + text);
  }
}
