/// <reference types="web-bluetooth" />
/// <reference types="w3c-web-serial" />

// home
import { Component, ElementRef, ViewChild } from '@angular/core';
import { BluetoothService } from './services/ble/ble';
import { NavController, AlertController } from '@ionic/angular';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Cast } from './utils/cast';
import * as Colors from './utils/color';

// authentication
import { AuthService } from '../home/services/auth/auth';
import { DeviceState, WebSocketService } from '../home/services/websocket/ws';
import { uint8ArrayToHexString } from '../home/utils/utils';
import * as forge from "node-forge";
import { printPubKeyRSA, importPubKeyRSA } from '../home/utils/encrypt';
import { getAccessToken, sync, createPlace, createEnvironment, createDevice } from '../home/services/backend/backend'

// logger
import { download } from './utils/logger';
import { DeviceService } from './services/device/device';
import { stressTest } from './services/testing/testing';

enum State {
  DISCONNECTED,
  BLUETOOTH,
  SCAN_WIFI,
  FIND_ME,
  CONNECT_WIFI,
  AUTHENTICATION,
  GET_KEY,
  SET_SECRET,
  REGISTER,
  SET_TICKET,
  READY,
  TESTING,
  CMD_ERASE_IR,
  CMD_GET_IR,
  CMD_SET_IR,
  CMD_GET_INFO,
  CMD_CANCEL_IR,
  CMD_EDIT_IR,
  CMD_RUN_SCENE,
  CMD_FAC_RESET,
  CMD_GET_HEAP,
  CMD_RESET,
  CMD_BLE_ON,
  CMD_BLE_OFF,
  CMD_FIND_ME,
  FAIL,
  PASS
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {
  @ViewChild('terminal1') terminal: ElementRef;
  @ViewChild('terminal2') terminal2: ElementRef;
  @ViewChild('terminal3') terminal3: ElementRef;
  @ViewChild('terminal4') terminal4: ElementRef;

  private device: DeviceService;
  private device2: DeviceService;
  public deviceSelected = false;
  public deviceSelected2 = false;
  public backend = "Staging";
  public product = "ONE";
  public wifiSsid = "PADOTEC";
  public wifiPassword = "P@d0t3c2021";
  public wifiBssid = '0263DA3A342A';

  // public isTesting = false;
  private term = new Terminal();
  private term2 = new Terminal();
  private term3 = new Terminal();
  private term4 = new Terminal();

  // authentication
  public gotKey = false;
  public secretSet = false;
  public ticketSet = false;
  public deviceRegistered = false;
  public isDevice = false;
  public gotKey2 = false;
  public secretSet2 = false;
  public ticketSet2 = false;
  public deviceRegistered2 = false;
  public isDevice2 = false;
  public twoDevices = false;

  private dev: DeviceService;
  public chosenDevice = 'source';

  public isConnected: boolean;
  public isAuthenticated: boolean;
  public isTesting: boolean;
  public stateEn = 'SOURCE';
  public stateClass = 'state-disconnected';

  private stress: stressTest;

  constructor(private nav: NavController, private alertController: AlertController) {
    this.device = new DeviceService(this.term, this.term2);
    this.device2 = new DeviceService(this.term3, this.term4);
    this.dev = this.device;
  }

  public addNewDeviceOnClick() {
    this.twoDevices = true;
  }

  public chooseSourceOnClick() {
    this.dev = this.device;
    this.stateEn = 'SOURCE';
  }

  public chooseTargetOnClick() {
    this.dev = this.device2;
    this.stateEn = 'TARGET';
  }

  public async deviceSelectionOnClick() {
    this.dev.deviceSelectionOnClick();
  }

  public isDeviceSelected() {
    return this.dev.deviceSelected;
  }

  public async scanWifiOnClick() {
    this.dev.scanWifiOnClick();
  }

  public async findMeOnClick() {
    this.dev.findMeOnClick();
  }

  public async connectToWifiOnClick() {
    this.dev.connectToWifiOnClick();
  }

  public isBleConnected() {
    return this.dev.isBleConnected();
  }

  public isConnectedToWifi() {
    return this.dev.isConnectedToWifi();
  }

  public async getKey() {
    this.gotKey = await this.dev.getKey();
  }

  public async setSecret() {
    this.secretSet = await this.dev.setSecret();
  }

  public async registerDevice() {
    this.deviceRegistered = await this.dev.registerDevice();
  }

  public async setTicket() {
    this.ticketSet = await this.dev.setTicket();
  }

  public async findMeWsHandler() {
    this.dev.findMeWsHandler();
  }

  private startTesting() {
    // this.localTest = new LocalTestingService(this.m_ip, this.m_myPubKeyPem, this.m_myPrivKey, this.m_devicePublicKey, this.m_deviceToken, this.socket);
    // const local = new LocalTestingService();
    // const remote = new RemoteTestingService();
  }

  public stressEraseIrOnClick() {
    this.stress.eraseIr(this.device, this.device2);
  }

  public stressGetIrOnClick() {
    this.stress.getIr(this.device, this.device2);
  }

  public stressSetIrOnClick() {
    this.stress.setIr(this.device, this.device2);
  }

  public stressGetInfoOnClick() {
    this.stress.getInfo(this.device, this.device2);
  }

  public stressCancelIrOnClick() {
    this.stress.cancelIr(this.device, this.device2);
  }

  public stressEditIrOnClick() {
    this.stress.editIr(this.device, this.device2);
  }

  public stressrunSceneOnClick() {
    this.stress.runScene(this.device, this.device2);
  }

  public isNotConnectedToWifiorIsTesting() {
    return this.dev.isNotConnectedToWifiorIsTesting();
  }

  public isStateTesting() {
    return this.ticketSet;
  }

  public getInfoOnClick() {
    this.dev.getInfoOnClick();
  }

  public eraseIrOnClick() {
    this.dev.eraseIrOnClick();
  }

  public getIrOnClick() {
    this.dev.getIrOnClick();
  }

  public setIrOnClick() {
    this.dev.setIrOnClick();
  }

  public cancelIrOnClick() {
    this.dev.cancelIrOnClick();
  }

  public editIrOnClick() {
    this.dev.editIrOnClick();
  }

  public runSceneOnClick() {
    this.dev.runSceneOnClick();
  }

  public facResetOnClick() {
    this.dev.facResetOnClick();
  }

  public getHeapOnClick() {
    this.dev.getHeapOnClick();
  }

  public resetOnClick() {
    this.dev.resetOnClick();
  }

  public bleOnOnClick() {
    this.dev.bleOnOnClick();
  }

  public bleOffOnClick() {
    this.dev.bleOffOnClick();
  }

  public findMeWsOnClick() {
    this.dev.findMeWsOnClick();
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

    const fitAddon3 = new FitAddon();
    this.term3.loadAddon(fitAddon3);
    this.term3.open(this.terminal3.nativeElement);
    fitAddon3.fit();

    const fitAddon4 = new FitAddon();
    this.term4.loadAddon(fitAddon4);
    this.term4.open(this.terminal4.nativeElement);
    fitAddon4.fit();

    window.onresize = () => {
      fitAddon.fit();
      fitAddon2.fit();
      fitAddon3.fit();
      fitAddon4.fit();
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
        },
        {
          name: 'bssid',
          type: 'text',
          value: this.wifiBssid,
          placeholder: 'Enter bssid (ex.: 0263DA3A342A)'
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

  public showKeyPairOnClick() {
    this.dev.showKeyPairOnClick();
  }

  public async onConnectDevice() {
    this.dev.onConnectDevice();
  }

  public async onDisconnectDevice() {
    this.dev.onDisconnectDevice();
  }

  public async saveTermOnClick() {
    this.dev.saveTermOnClick();
  }

  public async saveTerm2OnClick() {
    this.dev.saveTerm2OnClick();
  }

  public eraseTermOnClick() {
    this.dev.eraseTermOnClick();
  }

  public eraseTerm2OnClick() {
    this.dev.eraseTerm2OnClick();
  }
}
