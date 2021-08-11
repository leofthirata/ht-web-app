/// <reference types="web-bluetooth" />
/// <reference types="w3c-web-serial" />

// home
import { Component, ElementRef, ViewChild } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { PopoverController } from '@ionic/angular';

import { BluetoothService } from './services/ble/ble';
import { DeviceInfoComponent } from '../info/device-info/device-info.component';
import { UserInfoComponent } from '../info/user-info/user-info.component';

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
import { oneLocalStress } from './services/testing/auto-local-stress';
import { oneLocal } from './services/testing/auto-local';

enum Operation {
  BLE,
  AUTH,
  MAN_TEST,
};

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
  public devTicket: string;

  public teste = "In particular, the i2cdetect program will probe all the addresses on a bus, and report whether any devices are present. Enter the following command in the command line. The -y flag will disable interactive mode so that you do not have to wait for confirmation. The 1 indicates that we are scanning for I2C devices on I2C bus 1 (e.g. i2c-1).";
  
  private device2: DeviceService;
  public deviceSelected = false;
  public deviceSelected2 = false;
  public backend = "Production";
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
  public deviceDone = false;

  public gotKey2 = false;
  public secretSet2 = false;
  public ticketSet2 = false;
  public deviceRegistered2 = false;
  public isDevice2 = false;
  public device2Done = false;
  
  public twoDevices = false;

  private dev: DeviceService;
  public chosenDevice = 'source';

  public isConnected: boolean;
  public isAuthenticated: boolean;
  public isTesting: boolean;
  public stateEn = 'SOURCE';
  public stateClass = 'state-disconnected';

  public isTestingAndLocal = false;
  public isTestingAndRemote = false;
  private local: oneLocal;
  public localTest = false;
  private stress: oneLocalStress;
  public localStress = false;

  public showBle = true;
  public showAuth = false;
  public showManTests = false;
  public showAutoTests = false;

  constructor(private nav: NavController, private alertController: AlertController, private popoverController: PopoverController) {
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

  public isDeviceDone() {
    return this.device.isTicketSet();
  }

  public isDevice2Done() {
    return this.device2.isTicketSet();
  }

  public isDeviceSelected() {
    return this.dev.deviceSelected;
  }

  public scanWifiOnClick() {
    this.dev.scanWifiOnClick();
  }

  public findMeOnClick() {
    this.dev.findMeOnClick();
  }

  public connectToWifiOnClick() {
    this.dev.connectToWifiOnClick();
  }

  public updateOperation() {
    switch (this.dev.getOperation()) {
      case Operation.BLE: {
        this.showBle = true;
        this.showAuth = false;
        this.showManTests = false;
        break;
      }
      case Operation.AUTH: {
        this.showBle = false;
        this.showAuth = true;
        this.showManTests = false;
        break;
      }
      case Operation.MAN_TEST: {
        this.showBle = false;
        this.showAuth = false;
        this.showManTests = true;
        break;
      }
    }
  }

  public isBleConnected() {
    return this.dev.isBleConnected();
  }

  public isConnectedToWifi() {
    return this.dev.isConnectedToWifi();
  }

  public async getKey() {
    await this.dev.getKey();
  }

  public async setSecret() {
    await this.dev.setSecret();
  }

  public async registerDevice() {
    await this.dev.registerDevice();
  }

  public async setTicket() {
    await this.dev.setTicket();
  }

  public hasKey() {
    return this.dev.hasKey();
  }

  public isSecretSet() {
    return this.dev.isSecretSet();
  }

  public isDeviceRegistered() {
    return this.dev.isDeviceRegistered();
  }

  public isTicketSet() {
    const ok = this.dev.isTicketSet();
    if (ok) {
      this.enableTesting();
      this.isTesting = true;
    } else {
      this.isTesting = false;
    }
    return ok;
  }

  public async findMeWsHandler() {
    this.dev.findMeWsHandler();
  }

  private enableTesting() {
    this.dev.enableTesting();
    // this.localTest = new LocalTestingService(this.m_ip, this.m_myPubKeyPem, this.m_myPrivKey, this.m_devicePublicKey, this.m_deviceToken, this.socket);
    // const local = new LocalTestingService();
    // const remote = new RemoteTestingService();
  }

  public async localTestOnClick() {
    this.localTest = true;
    this.local = new oneLocal(this.device, this.term, this.device2, this.term3);
    await this.local.start();
    this.localTest = false;
  }

  public localStressTestOnClick() {
    this.localStress = true;
    this.stress = new oneLocalStress(this.device, this.term, this.device2, this.term3);
  }

  public stressEraseIrOnClick() {
    this.stress.eraseIr();
  }

  public stressGetIrOnClick() {
    this.stress.getIr();
  }

  public stressSetIrOnClick() {
    this.stress.setIr();
  }

  public stressGetInfoOnClick() {
    this.stress.getInfo();
  }

  public stressCancelIrOnClick() {
    this.stress.cancelIr();
  }

  public stressEditIrOnClick() {
    this.stress.editIr();
  }

  public stressrunSceneOnClick() {
    this.stress.runScene();
  }

  public stopStressTestOnClick() {
    this.stress.stopTest();
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

    // window.onresize = () => {
    //   fitAddon.fit();
    //   fitAddon2.fit();
    //   fitAddon3.fit();
    //   fitAddon4.fit();
    // };
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
            this.wifiBssid = ans.bssid;
            this.connectToWifiOnClick()          
          }
        }
      ]
    });

    await alert.present();
  }

  public setLocalOnClick() {
    this.isTestingAndLocal = true;
    this.isTestingAndRemote = false;
    this.dev.chooseLocalTest();
  }

  public setRemoteOnClick() {
    this.isTestingAndLocal = false;
    this.isTestingAndRemote = true;
    this.dev.chooseRemoteTest();
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
    this.device.saveTermOnClick();
  }

  public async saveTerm2OnClick() {
    this.device.saveTerm2OnClick();
  }

  public async saveTerm3OnClick() {
    this.device2.saveTermOnClick();
  }

  public async saveTerm4OnClick() {
    this.device2.saveTerm2OnClick();
  }

  public eraseTermOnClick() {
    this.device.eraseTermOnClick();
  }

  public eraseTerm2OnClick() {
    this.device.eraseTerm2OnClick();
  }

  public eraseTerm3OnClick() {
    this.device2.eraseTermOnClick();
  }

  public eraseTerm4OnClick() {
    this.device2.eraseTerm2OnClick();
  }

  public async showDeviceInfo(ev: any) {
    const devInfo = { 
      ip: this.device.getIp(), 
      uuid: this.device.getDevUuid(), 
      ticket: this.device.getDevTicket(), 
      key: this.device.getDevPubKeyPem(),
    };

    const popover = await this.popoverController.create({
      component: DeviceInfoComponent,
      event: ev,
      cssClass: 'popover_setting',
      componentProps: {
        device: devInfo
      },
      translucent: true
    });

    popover.onDidDismiss().then((result) => {
      console.log(result.data);
    });

    return await popover.present();
    /** Sync event from popover component */
  }

  public async showDevice2Info(ev: any) {
    const devInfo = { 
      ip: this.device2.getIp(), 
      uuid: this.device2.getDevUuid(), 
      ticket: this.device2.getDevTicket(), 
      key: this.device2.getDevPubKeyPem(),
    };

    const popover = await this.popoverController.create({
      component: DeviceInfoComponent,
      event: ev,
      cssClass: 'popover_setting',
      componentProps: {
        device: devInfo
      },
      translucent: true
    });

    popover.onDidDismiss().then((result) => {
      console.log(result.data);
    });

    return await popover.present();
    /** Sync event from popover component */
  }

  public async showUserInfo(ev: any) {
    const userInfo = { 
      ticket: this.device.getUserTicket(),
      pubKey: this.device.getMyPubKeyPem(),
      privKey: this.device.getMyPrivKeyPem(),
    };

    const popover = await this.popoverController.create({
      component: UserInfoComponent,
      event: ev,
      cssClass: 'popover_setting',
      componentProps: {
        user: userInfo
      },
      translucent: true
    });

    popover.onDidDismiss().then((result) => {
      console.log(result.data);
    });

    return await popover.present();
    /** Sync event from popover component */
  }

  public async showUser2Info(ev: any) {
    const userInfo = { 
      pubKey: this.device2.getMyPubKeyPem(),
      privKey: this.device2.getMyPrivKeyPem(),
    };

    const popover = await this.popoverController.create({
      component: UserInfoComponent,
      event: ev,
      cssClass: 'popover_setting',
      componentProps: {
        user: userInfo
      },
      translucent: true
    });

    popover.onDidDismiss().then((result) => {
      console.log(result.data);
    });

    return await popover.present();
    /** Sync event from popover component */
  }

  public reportBugOnClick() {
    window.open('https://gitlab.padotec.com.br/groups/hausenn/-/boards', '_blank');
  }

  async editEraseIr() {
    const alert = await this.alertController.create({
      header: 'ERASE_IR',
      inputs: [
        {
          name: 'cmd',
          type: 'text',
          placeholder: '1'
        },
        {
          name: 'id',
          type: 'text',
          placeholder: 'Enter password'
        },
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
            this.wifiBssid = ans.bssid;
            this.connectToWifiOnClick()          
          }
        }
      ]
    });

    await alert.present();
  }
}
