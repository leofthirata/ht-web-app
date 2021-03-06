/// <reference types="web-bluetooth" />
/// <reference types="w3c-web-serial" />

// home
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
import { timeout_ms, timeout_s, uint8ArrayToHexString } from '../home/utils/utils';
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

export class HomePage implements AfterViewInit {
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
  public wifiBssid = 'EE63DA3A342A';

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
  public isTesting = false;
  public stateEn = 'SOURCE';
  public stateClass = 'state-disconnected';

  public isManual = true;
  public isAutomated = false;

  public isTestingAndLocal = true;
  public isTestingAndRemote = false;
  private local: oneLocal;
  public localTest = false;
  private stress: oneLocalStress;
  public localStress = false;

  public showBle = true;
  public showAuth = false;
  public showManTests = false;
  public showAutoTests = false;

  public eraseIrId = 1;
  public setIrId = 1;
  public setIrCh = 3;
  public editIrId = 1;

  public eraseIrIndex = 1;
  public getIrIndex = 1;
  public setIrIndex = 1;
  public getInfoIndex = 1;
  public cancelIrIndex = 1;
  public editIrIndex = 1;
  public runSceneIndex = 1;
  public facResetIndex = 1;
  public getHeapIndex = 1;
  public resetIndex = 1;
  public bleOnIndex = 1;
  public bleOffIndex = 1;
  public findMeIndex = 1;
  public customIndex = 1;

  public eraseIrDelay = 0;
  public getIrDelay = 0;
  public setIrDelay = 0;
  public getInfoDelay = 0;
  public cancelIrDelay = 0;
  public editIrDelay = 0;
  public runSceneDelay = 0;
  public facResetDelay = 0;
  public getHeapDelay = 0;
  public resetDelay = 0;
  public bleOnDelay = 0;
  public bleOffDelay = 0;
  public findMeDelay = 0;
  public customDelay = 0;

  public send: string;

  constructor(private nav: NavController, private alertController: AlertController, private popoverController: PopoverController) {
    this.device = new DeviceService(this.term, this.term2);
    this.device2 = new DeviceService(this.term3, this.term4);
    this.dev = this.device;
  }

  ngAfterViewInit() {
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
    this.dev.connectToWifiOnClick(this.wifiSsid, this.wifiPassword, this.wifiBssid);
  }

  public async customBlePacketOnClick() {
    const alert = await this.alertController.create({
      header: 'CUSTOM CMD',
      inputs: [
        {
          name: 'packet',
          type: 'textarea',
          value: `0x1234`,
          placeholder: 'Enter hex to send through BLE'
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
          handler: async ans => {
            this.send = ans.packet;
            this.dev.customBlePacketOnClick(this.send);    
          }
        }
      ]
    });

    await alert.present();
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
    await this.local.startTests();
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

  public stressRunSceneOnClick() {
    this.stress.runScene();
  }

  public stressBleOnOffOnClick() {
    this.stress.bleOnOff();
  }

  public stressFindMeOnClick() {
    this.stress.findMe();
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

  public async getInfoOnClick() {
    for(let i = 0; i < this.getInfoIndex; i++) {
      this.dev.getInfoOnClick();
      await timeout_s(this.getInfoDelay);
    }
  }

  public async eraseIrOnClick() {
    for(let i = 0; i < this.eraseIrIndex; i++) {
      this.dev.eraseIrOnClick(this.eraseIrId);
      await timeout_s(this.eraseIrDelay);
    }
  }

  public async getIrOnClick() {
    for(let i = 0; i < this.getIrIndex; i++) {
      this.dev.getIrOnClick();
      await timeout_s(this.getIrDelay);
    }
  }

  public async setIrOnClick() {
    for(let i = 0; i < this.setIrIndex; i++) {
      this.dev.setIrOnClick(this.setIrId, this.setIrCh);
      await timeout_s(this.setIrDelay);
    }
  }

  public async cancelIrOnClick() {
    for(let i = 0; i < this.cancelIrIndex; i++) {
      this.dev.cancelIrOnClick();
      await timeout_s(this.cancelIrDelay);
    }
  }

  public async editIrOnClick() {
    for(let i = 0; i < this.editIrIndex; i++) {
      this.dev.editIrOnClick(this.editIrId);
      await timeout_s(this.editIrDelay);
    }
  }

  public async runSceneOnClick() {
    for(let i = 0; i < this.runSceneIndex; i++) {
      this.dev.runSceneOnClick();
      await timeout_s(this.runSceneDelay);
    }
  }

  public async facResetOnClick() {
    this.dev.facResetOnClick();
  }

  public async getHeapOnClick() {
    for(let i = 0; i < this.getHeapIndex; i++) {
      this.dev.getHeapOnClick();
      await timeout_s(this.getHeapDelay);
    }
  }

  public async resetOnClick() {
    for(let i = 0; i < this.resetIndex; i++) {
      this.dev.resetOnClick();
      await timeout_s(this.resetDelay);
    }
  }

  public async bleOnOnClick() {
    for(let i = 0; i < this.bleOnIndex; i++) {
      this.dev.bleOnOnClick();
      await timeout_s(this.bleOnDelay);
    }
  }

  public async bleOffOnClick() {
    for(let i = 0; i < this.bleOffIndex; i++) {
      this.dev.bleOffOnClick();
      await timeout_s(this.bleOffDelay);
    }
  }

  public async findMeWsOnClick() {
    for(let i = 0; i < this.findMeIndex; i++) {
      this.dev.findMeWsOnClick();
      await timeout_s(this.findMeDelay);
    }
  }

  public async customOnClick() {
    const alert = await this.alertController.create({
      header: 'CUSTOM CMD',
      inputs: [
        {
          name: 'json',
          type: 'textarea',
          value: `{ "cm": 1 }`,
          placeholder: 'Enter json to send'
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
          handler: async ans => {
            this.send = ans.json;
            for(let i = 0; i < this.customIndex; i++) {
              this.dev.sendCustomOnClick(JSON.parse(this.send));    
              await timeout_s(this.customDelay);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  public ionViewDidEnter() {
    // const fitAddon = new FitAddon();
    // this.term.loadAddon(fitAddon);
    // this.term.open(this.terminal.nativeElement);
    // fitAddon.fit();

    // const fitAddon2 = new FitAddon();
    // this.term2.loadAddon(fitAddon2);
    // this.term2.open(this.terminal2.nativeElement);
    // fitAddon2.fit();

    // const fitAddon3 = new FitAddon();
    // this.term3.loadAddon(fitAddon3);
    // this.term3.open(this.terminal3.nativeElement);
    // fitAddon3.fit();

    // const fitAddon4 = new FitAddon();
    // this.term4.loadAddon(fitAddon4);
    // this.term4.open(this.terminal4.nativeElement);
    // fitAddon4.fit();

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
            console.log(ans.pswd);
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

  public setManualOnClick() {
    this.isManual = true;
    this.isAutomated = false;
  }

  public setAutomatedOnClick() {
    this.isManual = false;
    this.isAutomated = true;
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

  public isPortConnected() {
    return this.dev.isPortConnected();
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
}
