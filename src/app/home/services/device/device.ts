/// <reference types="web-bluetooth" />
/// <reference types="w3c-web-serial" />

// home
import { Component, ElementRef, ViewChild } from '@angular/core';
import { BluetoothService } from '../../services/ble/ble';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Cast } from '../../utils/cast';
import * as Colors from '../../utils/color';
import { Observable, Subject } from 'rxjs';

// authentication
import { AuthService } from '../../services/auth/auth';
import { DeviceState, WebSocketService } from '../../services/websocket/ws';
import { uint8ArrayToHexString } from '../../utils/utils';
import * as forge from "node-forge";
import { printPubKeyRSA, importPubKeyRSA } from '../../utils/encrypt';
import { getAccessToken, sync, createPlace, createEnvironment, createDevice } from '../../services/backend/backend'
import { OneLocalTestingService } from '../testing/manual-local';
import { OneRemoteTestingService } from '../testing/manual-remote';

// logger
import { download } from '../../utils/logger';

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

enum Operation {
  BLE,
  AUTH,
  MAN_TEST,
  AUTO_TEST
};

export class DeviceService {
  public m_ble: BluetoothService;
  private bleConnected: boolean;
  public deviceSelected = false;
  public backend = "Staging";
  public product = "ONE";
  public wifiSsid = "PADOTEC";
  public wifiPassword = "P@d0t3c2021";
  public wifiBssid = '0263DA3A342A';
  public bleMac = "7C9EBDD71678";
  public manualLocalTest: OneLocalTestingService;
  public manualRemoteTest: OneRemoteTestingService;
  private local = true;
  public socket: WebSocketService;
  private remoteRequest: any;
  // public remoteTest: 
  private term: Terminal;
  private term2: Terminal;

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

  private loggerSubject$ = new Subject<any>();
  private loggerIndexSubject$ = new Subject<number>();

  private operation = Operation.BLE;

  private reader;
  private portConnected = false;

  constructor(term, term2) {
    this.term = term;
    this.term2 = term2;

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

    this.socket.sentRemotePacket$().subscribe((bytes) => {
      try {
        const str = JSON.stringify(bytes, null, 2);
        const date = new Date();
        const dateStr = `[${date.toLocaleTimeString()}] [WS REMOTE] SEND: ID ${bytes.messageId}`;
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
    })

    this.socket.rcvRemotePacket$().subscribe((resp) => {
      try {
        resp = JSON.parse(resp);
        const str = JSON.stringify(resp, null, 2);
        const date = new Date();
        const dateStr = `[${date.toLocaleTimeString()}] [WS REMOTE] RCVD: ID ${resp.messageId}`;
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

    this.socket.sentPacket$().subscribe((bytes) => {
      try {
        const socket = bytes.socket;
        delete bytes.socket;
        const str = JSON.stringify(bytes, null, 2);
        const date = new Date();
        const dateStr = `[${date.toLocaleTimeString()}] [WS LOCAL] SEND: SOCKET ${socket}`;
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

    this.socket.rcvPacket$().subscribe((obj) => {
      try {
        const socket = obj.socket;
        const str = obj.str;
        const date = new Date();
        const dateStr = `[${date.toLocaleTimeString()}] [WS LOCAL] RCVD: SOCKET ${socket}`;
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
    this.start();

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
        const dateStr = `[${date.toLocaleTimeString()}] [BLE] DECODED:`;
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
    await this.m_ble.disconnect();
  }

  public async findMeOnClick() {
    await this.m_ble.connect();
    await this.m_ble.getService();
    await this.m_ble.getCharacteristics();
    await this.m_ble.findMe();
    await this.m_ble.disconnect();
  }

  public async connectToWifiOnClick(ssid, pswd, bssid) {
    this.wifiSsid = ssid;
    this.wifiPassword = pswd;
    this.wifiBssid = bssid;

    await this.m_ble.connect();
    await this.m_ble.getService();
    await this.m_ble.getCharacteristics();
    await this.m_ble.connectToWifi(this.wifiSsid, this.wifiPassword, this.wifiBssid);
    this.m_ip = this.m_ble.getIp();
    console.log(this.m_ip)
    this.m_auth = new AuthService();
    await this.m_ble.disconnect();
    this.operation = Operation.AUTH;
    // this.nav.navigateForward('authentication', { state: this.m_ble.getIp() });
  }

  public async customBlePacketOnClick(data) {
    await this.m_ble.connect();
    await this.m_ble.getService();
    await this.m_ble.getCharacteristics();
    await this.m_ble.custom(data);
    await this.m_ble.disconnect();
  }

  public isBleConnected() {
    return this.m_ble.isConnected();
  }

  public isConnectedToWifi() {
    return this.m_ip !== '' ? true : false;
  }

  public async getKey() {
    this.m_myPubKey = this.m_auth.getPubKey();
    this.m_myPubKeyPem = forge.pki.publicKeyToPem(this.m_auth.getPubKey());
    this.m_myPrivKeyPem = forge.pki.privateKeyToPem(this.m_auth.getPrivKey());
    this.m_myPrivKey = this.m_auth.getPrivKey();

    const request = {
      "key": this.m_myPubKeyPem
    };

    const resp = await this.socket.localRequest(`ws://${this.m_ip}/get_key`, request, this.m_myPrivKey);
    console.log(resp);

    this.m_devicePublicKey = importPubKeyRSA(JSON.parse(resp).key);

    printPubKeyRSA(this.m_devicePublicKey);

    this.socket.setState(DeviceState.SEND_CMD);

    if (this.m_devicePublicKey !== undefined) {
      this.gotKey = true;
    } else {
      this.gotKey = false;
    }
  }

  public async setSecret() {
    this.m_secret = uint8ArrayToHexString(window.crypto.getRandomValues(new Uint8Array(16)));
    let secretRequest = { 
      'secret': this.m_secret,
      'key': this.m_myPubKeyPem
    };
    
    this.socket.setState(DeviceState.SEND_CMD);

    const resp = await this.socket.localRequest(`ws://${this.m_ip}/set_secret`, secretRequest, this.m_myPrivKey, this.m_devicePublicKey);
    const msg = JSON.parse(resp).mg;

    if (msg === 'success') {
      this.secretSet = true;
     } else {
      this.secretSet = false;
     }
  }

  public async registerDevice() {
    // const refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIwZDU4YmIzYy1hNzZjLTQwYzEtYjA4ZS01MjJkOGQwMmE1ZjUifQ.eyJqdGkiOiJiZmI4ZTA1MC0zMGE0LTQyMmItOTc5Ni0xMzEzMzQ3YjRjMTUiLCJleHAiOjAsIm5iZiI6MCwiaWF0IjoxNjI1NzQ4MDkwLCJpc3MiOiJodHRwczovL3N0YWdlLnBhZG90ZWMuY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJhdWQiOiJodHRwczovL3N0YWdlLnBhZG90ZWMuY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJzdWIiOiJkZTFjMmIyMy1hNGM0LTRiYzQtYjQ2Ni0zNTM4OTVmNTgxOTAiLCJ0eXAiOiJPZmZsaW5lIiwiYXpwIjoiaGF1c2Vubi1jbGllbnQtYXBwIiwiYXV0aF90aW1lIjowLCJzZXNzaW9uX3N0YXRlIjoiMTM5MzAyZjgtZDBhZC00ZjFjLWJlOWQtOTRlYjdkMGNhNTJmIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBvZmZsaW5lX2FjY2VzcyBlbWFpbCBwcm9maWxlIn0.TqvywFzLXqEYZHCi1w4EAwFNQPfGPyfA14IJ5Bu_bac";
    const accessToken = await getAccessToken(this.refreshToken);
    const user = await sync(accessToken);
    const place = await createPlace(accessToken, 'Local1', 'Address1');
    const env = await createEnvironment(accessToken, place, 'Environment1');
    const dev = await createDevice(this.m_secret, accessToken, env, 'Device1', this.m_ip, '123123', '321321', 'PADOTEC', 'one', forge.pki.publicKeyToPem(this.m_devicePublicKey));
    this.m_userTicket = user[1];
    this.m_userUuid = user[0];
    this.m_deviceTicket = dev[0];
    this.m_deviceUuid = dev[1];
    this.m_deviceToken = dev[2];

    console.log(this.m_deviceTicket);
    console.log(this.m_deviceUuid);
    console.log(this.m_deviceToken);

    if (dev !== undefined) {
      this.deviceRegistered = true;
    } else {
      this.deviceRegistered = false;
    }

    this.remoteRequest = {
      'payload': {
        'macToken': this.m_deviceToken,
      },
      'sender': this.m_userUuid,
      'recipient': this.m_deviceUuid,
    };
  }

  public async setTicket() {
    let ticketRequest = { 
      'ticket': this.m_deviceTicket,
      'uuid': this.m_deviceUuid,
      'key': this.m_myPubKeyPem
    };
    
    const resp = await this.socket.localRequest(`ws://${this.m_ip}/set_ticket`, ticketRequest, this.m_myPrivKey, this.m_devicePublicKey);
    const msg = JSON.parse(resp).mg;

    // this.startTesting();
    if (msg === 'success') {
      this.ticketSet = true;
      this.operation = Operation.MAN_TEST;
      this.enableTesting();
     } else {
      this.ticketSet = false;
     }
  }

  public async findMeWsHandler() {
    let request = { 
      'findme': 'on',
    };
    
    this.socket.setState(DeviceState.FIND_ME);

    this.socket.localRequest(`ws://${this.m_ip}/findme`, request, this.m_myPrivKey, this.m_devicePublicKey);

    this.socket.setState(DeviceState.SEND_CMD);
  }

  public enableTesting() {
    this.manualLocalTest = new OneLocalTestingService(this.m_ip, this.m_myPubKeyPem, this.m_myPrivKey, this.m_devicePublicKey, this.m_deviceToken, this.socket);
    this.manualRemoteTest = new OneRemoteTestingService(this.m_userTicket, this.remoteRequest, this.socket);
    // const remote = new RemoteTestingService();
  }

  public chooseLocalTest() {
    this.local = true;
  }

  public chooseRemoteTest() {
    this.local = false;
  }

  public hasKey() {
    return this.gotKey;
  }
  
  public isSecretSet() {
    return this.secretSet;
  }

  public isTicketSet() {
    return this.ticketSet;
  }

  public isDeviceRegistered() {
    return this.deviceRegistered;
  }

  public isNotConnectedToWifiorIsTesting() {
    return (this.m_ip === '' ? true : false) || this.isStateTesting();
  }

  public isStateTesting() {
    return this.ticketSet;
  }

  public getInfoOnClick() {
    if (this.local) {
      this.manualLocalTest.GET_INFO();
    } else {
      this.manualRemoteTest.GET_INFO();
    }
  }

  public eraseIrOnClick(id: number) {
    if (this.local) {
      this.manualLocalTest.ERASE_IR(id);
    } else {
      this.manualRemoteTest.ERASE_IR(id);
    }
  }

  public getIrOnClick() {
    if (this.local) {
      this.manualLocalTest.GET_IR();
    } else {
      this.manualRemoteTest.GET_IR();
    }
  }

  public setIrOnClick(id: number, ch: number) {
    if (this.local) {
      this.manualLocalTest.SET_IR(id, ch);
    } else {
      this.manualRemoteTest.SET_IR(id, ch);
    }
  }

  public cancelIrOnClick() {
    if (this.local) {
      this.manualLocalTest.CANCEL_IR();
    } else {
      this.manualRemoteTest.CANCEL_IR();
    }
  }

  public editIrOnClick(id: number) {
    if (this.local) {
      this.manualLocalTest.EDIT_IR(id);
    } else {
      this.manualRemoteTest.EDIT_IR(id);
    }
  }

  public runSceneOnClick() {
    if (this.local) {
      this.manualLocalTest.RUN_SCENE();
    } else {
      this.manualRemoteTest.RUN_SCENE();
    }
  }

  public facResetOnClick() {
    if (this.local) {
      this.manualLocalTest.FAC_RESET();
    } else {
      this.manualRemoteTest.FAC_RESET();
    }
  }

  public getHeapOnClick() {
    if (this.local) {
      this.manualLocalTest.GET_HEAP();
    } else {
      this.manualRemoteTest.GET_HEAP();
    }
  }

  public resetOnClick() {
    if (this.local) {
      this.manualLocalTest.RESET();
    } else {
      this.manualRemoteTest.RESET();
    }
  }

  public bleOnOnClick() {
    if (this.local) {
      this.manualLocalTest.BLE_ON();
    } else {
      this.manualRemoteTest.BLE_ON();
    }
  }

  public bleOffOnClick() {
    if (this.local) {
      this.manualLocalTest.BLE_OFF();
    } else {
      this.manualRemoteTest.BLE_OFF();
    }
  }

  public findMeWsOnClick() {
    if (this.local) {
      this.manualLocalTest.FIND_ME();
    } else {
      this.manualRemoteTest.FIND_ME();
    }
  }

  public sendCustomOnClick(request) {
    if (this.local) {
      this.manualLocalTest.CUSTOM(request);
    } else {
      this.remoteRequest.payload.command = request;
      this.manualRemoteTest.CUSTOM(this.remoteRequest);
    }
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

  public showKeyPairOnClick() {
    const date = new Date();
    const dateStr = `[${date.toLocaleTimeString()}] [KEYS]:\n\r`;
    this.white(dateStr);
    this.white(this.m_myPubKeyPem);
    this.white(this.m_myPrivKeyPem);
    this.white('DEVICE_KEY:\n\r');
    this.white(this.m_devicePublicKey);
  }

  public async onConnectDevice() {
    this.devPort = await this.open();

    if (this.devPort) {
      this.portConnected = true;
      const date = new Date();
      const dateStr = `[${date.toLocaleTimeString()}] [SERIAL] Connected to serial port\n\r`;
      this.green(dateStr);

      const buf1 = Cast.stringToBytes(dateStr);
      let buffer = new Uint8Array(buf1.length);
      buffer.set(buf1);
      this.loggerIndex += buf1.length;
      this.readUntilClosed();
    }
  }

  async readUntilClosed() {
    let buffer: number[] = [];
    var index = 0;

    this.reader = this.devPort.readable.getReader();
    try {
      while (true) {
        const { value, done } = await this.reader.read();
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
      this.reader.releaseLock();
    }
  }

  public async onDisconnectDevice() {
    this.portConnected = false;
    this.reader.cancel();
    this.reader.releaseLock();
    await this.close(this.devPort);

    const date = new Date();
    const dateStr = `[${date.toLocaleTimeString()}] [SERIAL] Serial port disconnected\n\r`;
    this.yellow(dateStr);

    const buf1 = Cast.stringToBytes(dateStr);
    let buffer = new Uint8Array(buf1.length);
    buffer.set(buf1);
    this.loggerIndex += buf1.length;
  }

  public isPortConnected() {
    return this.portConnected;
  }
  
  private async open(): Promise<SerialPort> {
    try {
      const port = await navigator.serial.requestPort({
        filters: [{ usbProductId: 60000, usbVendorId: 4292},
                  { usbProductId: 24592, usbVendorId: 1027}]
      });

      await port.open({ baudRate: 115200, bufferSize: 4096, flowControl: 'none' });

      return port;
    } catch (error) {
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

  public getOperation() {
    return this.operation;
  }

  public getDevTicket() {
    return this.m_deviceTicket;
  }

  public getUserUuid() {
    return this.m_userUuid;
  }

  public getDevUuid() {
    return this.m_deviceUuid;
  }

  public getMyPubKeyPem() {
    if (this.m_myPubKey) {
      return this.m_myPubKeyPem;
    }
    return '';
  }

  public getMyPrivKeyPem() {
    if (this.m_myPrivKey) {
      return this.m_myPrivKey;
    }
    return '';
  }

  public getMyPrivKey() {
    return this.m_myPrivKey;
  }

  public getDevPubKeyPem() {
    if (this.m_devicePublicKey) {
      return this.m_devicePublicKey;
    }
    return '';
  }

  public getToken() {
    return this.m_deviceToken;
  }

  public getIp() {
    return this.m_ip;
  }

  public getLogger() {
    return this.logger;
  }

  public updateLogger(newLogger) {
    this.loggerIndex = newLogger.length;
    this.logger = new Uint8Array(this.loggerIndex);
    this.logger.set(newLogger);
  }

  public getLoggerIndex() {
    return this.loggerIndex;
  }

  public getSocket() {
    return this.socket;
  }

  public getUserTicket() {
    return this.m_userTicket;
  }

  private start() {
    this.deviceSelected = false;
    this.m_ble = new BluetoothService(this.bleMac);
    this.m_ip = '';
    this.m_auth = null;
    this.manualLocalTest = null;
    this.manualRemoteTest = null;
    this.local = true;
    this.remoteRequest = null;
  
    this.m_devicePublicKey = null;
    this.m_secret = null;
    this.m_deviceTicket = null;
    this.m_deviceUuid = null;
    this.m_userTicket = null;
    this.m_userUuid = null;
    this.gotKey = false;
    this.secretSet = false;
    this.ticketSet = false;
    this.deviceRegistered = false;
  
    // testing
    this.m_deviceToken = null;
    this.m_myPubKey = null; 
    this.m_myPubKeyPem = null; 
    this.m_myPrivKey = null;
    this.m_myPrivKeyPem = null;
  
    this.isConnected = false;
    this.isAuthenticated = false;
    this.isTesting = false;
    this.stateEn = 'BLE DISCONNECTED';
    this.stateClass = 'state-disconnected';
  
    this.operation = Operation.BLE;
  }

  public logger$(): Observable<any> {
    return this.loggerSubject$.asObservable();
  }

  public loggerIndex$(): Observable<number> {
    return this.loggerIndexSubject$.asObservable();
  }
}
