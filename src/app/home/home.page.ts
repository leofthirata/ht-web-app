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
import { LocalTestingService } from '../testing/testing';

// logger
import { download } from './utils/logger';

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

  private m_ble: BluetoothService;
  private bleConnected: boolean;
  public deviceSelected = false;
  public backend = "Staging";
  public product = "ONE";
  public wifiSsid = "PADOTEC";
  public wifiPassword = "P@d0t3c2021";
  public wifiBssid = '';
  public bleMac = "7C9EBDD71678";
  public localTest: LocalTestingService;
  private socket: WebSocketService;

  // public remoteTest: 
  private term = new Terminal();
  private term2 = new Terminal();

  private devPort!: SerialPort;
  private devConnected = false;

  // public isTesting = false;

  // authentication
  private m_auth: AuthService;
  private m_devicePublicKey;
  private m_ip: string = '';
  private m_secret: string;
  private m_deviceTicket: string;
  private m_deviceUuid: string;
  private m_userTicket: string;
  private m_userUuid: string;
  public gotKey = false;
  public secretSet = false;
  public ticketSet = false;
  public deviceRegistered = false;
  private readonly refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI2NTZkZTY4Yi1mMGVjLTQzOTEtODk4Yi0xMjliNWRhYWExYjkifQ.eyJpYXQiOjE2Mjc0OTE2NjEsImp0aSI6ImI1ZTNkYTgxLWIzMDUtNGE1Zi04M2RiLWFkMWY4NzEwNGZiZCIsImlzcyI6Imh0dHBzOi8vYXV0aC5oYXVzZW5uLmNvbS5ici9hdXRoL3JlYWxtcy9oYXVzZW5uIiwiYXVkIjoiaHR0cHM6Ly9hdXRoLmhhdXNlbm4uY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJzdWIiOiJjOGY2NzkxMy0zNGJjLTRmNDQtYTNjZC00OTEzNjY1NzBkMjYiLCJ0eXAiOiJPZmZsaW5lIiwiYXpwIjoiaGF1c2Vubi1jbGllbnQtYXBwIiwic2Vzc2lvbl9zdGF0ZSI6ImQ4Y2YzNjk0LTE2ZDgtNDUyOS1iYmQ3LWVkZTRlMTFiNzgxNiIsInNjb3BlIjoib3BlbmlkIG9mZmxpbmVfYWNjZXNzIGVtYWlsIHByb2ZpbGUifQ.evxZeBQZQl0YIbhTM8WYjiGu1hchGDGKLkNV8NmZ31g';

  // testing
  private m_deviceToken;
  private m_myPubKey; 
  private m_myPubKeyPem; 
  private m_myPrivKey;
  private m_myPrivKeyPem;

  public isConnected: boolean;
  public isAuthenticated: boolean;
  public isTesting: boolean;
  public stateEn = 'BLE DISCONNECTED';
  public stateClass = 'state-disconnected';

  private logger = new Uint8Array();
  private loggerIndex = 0;

  private logger2 = new Uint8Array();

  constructor(private nav: NavController, private alertController: AlertController) {
    navigator.serial.addEventListener('disconnect', (event) => {
      const port = event.target as SerialPort;
      console.log('Port disconnected', port);

      if (port === this.devPort) {
        this.devConnected = false;
      }
      
      this.setState(State.DISCONNECTED);
    });

    this.socket = new WebSocketService();

    this.socket.setState(DeviceState.GET_KEY);

    this.socket.sentPacket$().subscribe((bytes) => {
      try {
        const str = JSON.stringify(bytes, null, 2);
        const date = new Date();
        const dateStr = `[${date.toLocaleTimeString()}] [WS] SEND:`;
        this.yellow(dateStr);

        const buf1 = Cast.stringToBytes(dateStr);
        const buf2 = Cast.stringToBytes(str + '\n\r');
        let buffer = new Uint8Array(buf1.length + buf2.length);
        buffer.set(buf1);
        buffer.set(buf2, buf1.length);
        this.loggerIndex += buf1.length + buf2.length;

        try {
          this.white(str);
          this.logTerm(buffer);
        } catch (error) {
          this.red(str);
        }
      } catch (error) {
        this.red('Rx Error: ' + error);
      }
    });

    this.socket.rcvPacket$().subscribe((str) => {
      try {
        const date = new Date();
        const dateStr = `[${date.toLocaleTimeString()}] [WS] RCVD:`;
        this.yellow(dateStr);

        const buf1 = Cast.stringToBytes(dateStr);
        const buf2 = Cast.stringToBytes(str + '\n\r');
        let buffer = new Uint8Array(buf1.length + buf2.length);
        buffer.set(buf1);
        buffer.set(buf2, buf1.length);
        this.loggerIndex += buf1.length + buf2.length;

        try {
          this.white(str);
          this.logTerm(buffer);
        } catch (error) {
          this.red(str);
        }
      } catch (error) {
        this.red('Rx Error: ' + error);
      }
    });
  }

  public async deviceSelectionOnClick() {
    this.m_ble = new BluetoothService(this.bleMac);

    this.m_ble.sentPacket$().subscribe((bytes) => {
      try {
        const str = Cast.bytesToHex(new Uint8Array(bytes));
        const date = new Date();
        const dateStr = `[${date.toLocaleTimeString()}] [BLE] SEND:`;
        this.blue(dateStr);

        const buf1 = Cast.stringToBytes(dateStr);
        const buf2 = Cast.stringToBytes(str + '\n\r');
        let buffer = new Uint8Array(buf1.length + buf2.length);
        buffer.set(buf1);
        buffer.set(buf2, buf1.length);
        this.loggerIndex += buf1.length + buf2.length;

        try {
          this.white(str);
          this.logTerm(buffer);
        } catch (error) {
          this.red(str);
        }
      } catch (error) {
        this.red('Rx Error: ' + error);
      }
    });

    this.m_ble.rcvPacket$().subscribe((bytes) => {
      try {
        const str = Cast.bytesToHex(new Uint8Array(bytes));
        const date = new Date();
        const dateStr = `[${date.toLocaleTimeString()}] [BLE] RCVD:`;
        this.blue(dateStr);

        const buf1 = Cast.stringToBytes(dateStr);
        const buf2 = Cast.stringToBytes(str + '\n\r');
        let buffer = new Uint8Array(buf1.length + buf2.length);
        buffer.set(buf1);
        buffer.set(buf2, buf1.length);
        this.loggerIndex += buf1.length + buf2.length;

        try {
          this.white(str);
          this.logTerm(buffer);
        } catch (error) {
          this.red(str);
        }
      } catch (error) {
        this.red('Rx Error: ' + error);
      }
    });

    this.m_ble.rcvParsed$().subscribe((bytes) => {
      try {
        const str = JSON.stringify(bytes, null, 2);
        const date = new Date();
        const dateStr = `[${date.toLocaleTimeString()}] [BLE] PARSED:`;
        this.blue(dateStr);

        const buf1 = Cast.stringToBytes(dateStr);
        const buf2 = Cast.stringToBytes(str + '\n\r');
        let buffer = new Uint8Array(buf1.length + buf2.length);
        buffer.set(buf1);
        buffer.set(buf2, buf1.length);
        this.loggerIndex += buf1.length + buf2.length;

        try {
          this.white(str);
          this.logTerm(buffer);
        } catch (error) {
          this.red(str);
        }
      } catch (error) {
        this.red('Rx Error: ' + error);
      }
    });

    await this.m_ble.find();
    console.log(this.wifiSsid);
    console.log(this.wifiPassword);
    console.log(this.product);
    this.deviceSelected = true;
  }

  //TODO: disconnect after getting IP
  public async scanWifiOnClick() {
    await this.m_ble.connect();
    await this.m_ble.getService();
    await this.m_ble.getCharacteristics();
    await this.m_ble.scanWifi(15);
  }

  public async findMeOnClick() {
    await this.m_ble.connect();
    await this.m_ble.getService();
    await this.m_ble.getCharacteristics();
    await this.m_ble.findMe();
  }

  public async connectToWifiOnClick() {
    await this.m_ble.connect();
    await this.m_ble.getService();
    await this.m_ble.getCharacteristics();
    await this.m_ble.connectToWifi(this.wifiSsid, this.wifiPassword);
    this.m_ip = this.m_ble.getIp();
    console.log(this.m_ip)
    this.m_auth = new AuthService();
    // this.nav.navigateForward('authentication', { state: this.m_ble.getIp() });
  }

  public isBleConnected() {
    this.bleConnected = this.m_ble.isConnected();
    console.log(this.bleConnected);
    return this.bleConnected;
  }

  public isConnectedToWifi() {
    return this.m_ip !== '' ? true : false;
  }

  public async getKey() {
    this.gotKey = true;
    this.m_myPubKey = this.m_auth.getPubKey();
    this.m_myPubKeyPem = forge.pki.publicKeyToPem(this.m_auth.getPubKey());
    this.m_myPrivKeyPem = forge.pki.privateKeyToPem(this.m_auth.getPrivKey());
    this.m_myPrivKey = this.m_auth.getPrivKey();

    const request = {
      "key": this.m_myPubKeyPem
    };

    const onOpen = await this.socket.open(`ws://${this.m_ip}/get_key`, this.m_myPrivKey);
    const onSend = await this.socket.send(request);
    const resp = await this.socket.receive();
    console.log(resp);

    this.m_devicePublicKey = importPubKeyRSA(JSON.parse(resp).key);

    printPubKeyRSA(this.m_devicePublicKey);

    this.gotKey = true;
  }

  public async setSecret() {
    this.m_secret = uint8ArrayToHexString(window.crypto.getRandomValues(new Uint8Array(16)));
    let secretRequest = { 
      'secret': this.m_secret,
      'key': this.m_myPubKeyPem
    };
    
    this.socket.setState(DeviceState.SEND_CMD);

    const onOpen = await this.socket.open(`ws://${this.m_ip}/set_secret`, this.m_myPrivKey);
    const onSend = await this.socket.send(secretRequest, this.m_devicePublicKey);
    const resp = await this.socket.receive();
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'SECRET_FAIL';
    }
    this.secretSet = true;
  }

  public async registerDevice() {
    // const refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIwZDU4YmIzYy1hNzZjLTQwYzEtYjA4ZS01MjJkOGQwMmE1ZjUifQ.eyJqdGkiOiJiZmI4ZTA1MC0zMGE0LTQyMmItOTc5Ni0xMzEzMzQ3YjRjMTUiLCJleHAiOjAsIm5iZiI6MCwiaWF0IjoxNjI1NzQ4MDkwLCJpc3MiOiJodHRwczovL3N0YWdlLnBhZG90ZWMuY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJhdWQiOiJodHRwczovL3N0YWdlLnBhZG90ZWMuY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJzdWIiOiJkZTFjMmIyMy1hNGM0LTRiYzQtYjQ2Ni0zNTM4OTVmNTgxOTAiLCJ0eXAiOiJPZmZsaW5lIiwiYXpwIjoiaGF1c2Vubi1jbGllbnQtYXBwIiwiYXV0aF90aW1lIjowLCJzZXNzaW9uX3N0YXRlIjoiMTM5MzAyZjgtZDBhZC00ZjFjLWJlOWQtOTRlYjdkMGNhNTJmIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBvZmZsaW5lX2FjY2VzcyBlbWFpbCBwcm9maWxlIn0.TqvywFzLXqEYZHCi1w4EAwFNQPfGPyfA14IJ5Bu_bac";
    const accessToken = await getAccessToken(this.refreshToken);
    const user = await sync(accessToken);
    const place = await createPlace(accessToken, 'Local1', 'Address1');
    const env = await createEnvironment(accessToken, place, 'Environment1');
    const dev = await createDevice(this.m_secret, accessToken, env, 'Device1', this.m_ip, '123123', '321321', 'PADOTEC', 'one', forge.pki.publicKeyToPem(this.m_devicePublicKey));
    this.m_userTicket = user[0];
    this.m_userUuid = user[1];
    this.m_deviceTicket = dev[0];
    this.m_deviceUuid = dev[1];
    this.m_deviceToken = dev[2];
    this.deviceRegistered = true;
  }

  public async setTicket() {
    let ticketRequest = { 
      'ticket': this.m_userTicket,
      'uuid': this.m_userUuid,
      'key': this.m_myPubKeyPem
    };
    
    const onOpen = await this.socket.open(`ws://${this.m_ip}/set_ticket`, this.m_myPrivKey);
    const onSend = await this.socket.send(ticketRequest, this.m_devicePublicKey);
    const resp = await this.socket.receive();
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'TICKET_FAIL';
    }
    this.ticketSet = true;

    this.startTesting();
  }

  private startTesting() {
    this.localTest = new LocalTestingService(this.m_ip, this.m_myPubKeyPem, this.m_myPrivKey, this.m_devicePublicKey, this.m_deviceToken, this.socket);
    // const local = new LocalTestingService();
    // const remote = new RemoteTestingService();
  }

  public isNotConnectedToWifiorIsTesting() {
    return (this.m_ip === '' ? true : false) || this.isStateTesting();
  }

  public isStateTesting() {
    return this.ticketSet;
  }

  public getInfoOnClick() {
    this.localTest.GET_INFO();
  }

  public eraseIrOnClick() {
    this.localTest.ERASE_IR();
  }

  public getIrOnClick() {
    this.localTest.GET_IR();
  }

  public setIrOnClick() {
    this.localTest.SET_IR();
  }

  public cancelIrOnClick() {
    this.localTest.CANCEL_IR();
  }

  public editIrOnClick() {
    this.localTest.EDIT_IR();
  }

  public runSceneOnClick() {
    this.localTest.RUN_SCENE();
  }

  public facResetOnClick() {
    this.localTest.FAC_RESET();
  }

  public getHeapOnClick() {
    this.localTest.GET_HEAP();
  }

  public resetOnClick() {
    this.localTest.RESET();
  }

  public bleOnOnClick() {
    this.localTest.BLE_ON();
  }

  public bleOffOnClick() {
    this.localTest.BLE_OFF();
  }

  public findMeWsOnClick() {
    this.localTest.FIND_ME();
  }

  private setState(state: State) {
    switch (state) {
      case State.DISCONNECTED:
        this.stateEn = 'BLE DISCONNECTED';
        this.stateClass = 'state-disconnected';
        this.isTesting = false;
        this.isConnected = false;
        this.isAuthenticated = false;
        break;
      case State.BLUETOOTH:
        this.stateEn = 'BLE CONFIGURATION';
        this.stateClass = 'state-bluetooth';
        this.isTesting = false;
        this.isConnected = true;
        this.isAuthenticated = false;
        break;
      case State.AUTHENTICATION:
        this.stateEn = 'AUTHENTICATION';
        this.stateClass = 'state-authentication';
        this.isTesting = false;
        this.isConnected = true;
        this.isAuthenticated = false;
        break;
      case State.READY:
        this.stateEn = 'READY';
        this.stateClass = 'state-ready';
        this.isConnected = true;
        this.isTesting = false;
        this.isAuthenticated = false;
        break;
      case State.TESTING:
        this.stateEn = 'RUNNING TEST';
        this.stateClass = 'state-testing';
        this.isConnected = true;
        this.isTesting = true;
        this.isAuthenticated = false;
        break;
      case State.FAIL:
        this.stateEn = 'FAIL';
        this.stateClass = 'state-fail';
        this.isConnected = true;
        this.isTesting = false;
        this.isAuthenticated = false;
        break;
      case State.PASS:
        this.stateEn = 'PASS';
        this.stateClass = 'state-pass';
        this.isConnected = true;
        this.isTesting = false;
        this.isAuthenticated = false;
        break;
    }
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
      const date = new Date();
      const dateStr = `[${date.toLocaleTimeString()}] [SERIAL] Connected to serial port\n\r`;
      this.green(dateStr);

      const buf1 = Cast.stringToBytes(dateStr);
      let buffer = new Uint8Array(buf1.length);
      buffer.set(buf1);
      this.loggerIndex += buf1.length;
    }

    this.readUntilClosed();
  }

  async readUntilClosed() {
    let reader;
    let buffer: number[] = [];
    var index = 0;

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

          index += buffer.length;
          // create bigger uint8array
          if (index > this.logger2.length) {
            const buf: Uint8Array = this.logger2;
            this.logger2 = new Uint8Array(index);
            this.logger2.set(buf);
            this.logger2.set(new Uint8Array(buffer), buf.length);
          }
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

  private logTerm(buffer: Uint8Array) {
    if (this.loggerIndex > this.logger.length) {
      const buf: Uint8Array = this.logger;
      this.logger = new Uint8Array(this.loggerIndex);
      this.logger.set(buf);
      this.logger.set(new Uint8Array(buffer), buf.length);
    }
  }

  public async saveTermOnClick() {
    await download(this.logger, 'term');
    this.logger = new Uint8Array();
  }

  public async saveTerm2OnClick() {
    await download(this.logger2, 'term2');
    this.logger2 = new Uint8Array();
  }

  public eraseTermOnClick() {
    this.term.clear();
  }

  public eraseTerm2OnClick() {
    this.term2.clear();
  }

  private white(text: string) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    this.term.write(Colors.white);
    this.term.write(utf8);
    this.term.write('\r\n');
  }

  private blue(text: string) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    this.term.write(Colors.blue);
    this.term.write(utf8);
    this.term.write('\r\n');
  }

  private red(text: string) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    this.term.write(Colors.red);
    this.term.write(utf8);
    this.term.write('\r\n');
  }

  private green(text: string) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    this.term.write(Colors.green);
    this.term.write(utf8);
    this.term.write('\r\n');
  }

  private yellow(text: string) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    this.term.write(Colors.yellow);
    this.term.write(utf8);
    this.term.write('\r\n');
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
