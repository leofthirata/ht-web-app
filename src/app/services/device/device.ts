/// <reference types="web-bluetooth" />
/// <reference types="w3c-web-serial" />

// home
import { BluetoothService } from '../../services/ble/ble';
import { Terminal } from 'xterm';
import { Cast } from '../../utils/cast';
import { Observable, Subject } from 'rxjs';

import { AlertController } from '@ionic/angular';

// authentication
import { AuthService } from '../../services/auth/auth';
import { DeviceState, WebSocketService } from '../../services/websocket/ws';
import { timeout_ms, uint8ArrayToHexString } from '../../utils/utils';
import * as forge from "node-forge";
import { printPubKeyRSA, importPubKeyRSA } from '../../utils/encrypt';
import { getAccessToken, sync, createPlace, createEnvironment, createDevice } from '../../services/backend/backend'
import { OneLocalTestingService } from '../testing/one/manual-local';
import { OneRemoteTestingService } from '../testing/one/manual-remote';

import { Log } from '../../utils/log';

// logger
import { download } from '../../utils/logger';
import { LuminaLocalTestingService } from '../testing/lumina/manual-local';

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
  public ble: BluetoothService;
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
  public luminaLocalTest: LuminaLocalTestingService;
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
  private auth: AuthService;
  private devicePublicKey;
  private ip: string = '';
  private secret: string;
  private deviceTicket: string;
  private deviceUuid: string;
  private userTicket: string;
  private userUuid: string;
  public gotKey = false;
  public secretSet = false;
  public ticketSet = false;
  public deviceRegistered = false;
  private readonly refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI2NTZkZTY4Yi1mMGVjLTQzOTEtODk4Yi0xMjliNWRhYWExYjkifQ.eyJpYXQiOjE2Mzk0OTkwMDEsImp0aSI6IjUwOGM1NjQ3LWVkNDgtNDE2NC1iODIwLWRhNzdlZjljZjIyMyIsImlzcyI6Imh0dHBzOi8vYXV0aC5oYXVzZW5uLmNvbS5ici9hdXRoL3JlYWxtcy9oYXVzZW5uIiwiYXVkIjoiaHR0cHM6Ly9hdXRoLmhhdXNlbm4uY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJzdWIiOiJjOGY2NzkxMy0zNGJjLTRmNDQtYTNjZC00OTEzNjY1NzBkMjYiLCJ0eXAiOiJPZmZsaW5lIiwiYXpwIjoiaGF1c2Vubi1jbGllbnQtYXBwIiwic2Vzc2lvbl9zdGF0ZSI6ImRkYTZkYzJhLTNkYmYtNDA0Yy04Yzk4LWU4NWU0YmE1M2M1NyIsInNjb3BlIjoib3BlbmlkIG9mZmxpbmVfYWNjZXNzIGVtYWlsIHByb2ZpbGUifQ.bcDKkixRqdNqhJJ9NGcJD0kyvInef9l4PCbDix-Npv4';

  // testing
  private deviceToken;
  private myPubKey; 
  private myPubKeyPem; 
  private myPrivKey;
  private myPrivKeyPem;

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

  private token;

  private customPacket: string;

  constructor(private alertController: AlertController, term: Terminal, term2: Terminal) {
    this.term = term;
    this.term2 = term2;

    navigator.serial.addEventListener('disconnect', async (event) => {
      let port = event.target as SerialPort;
      console.log('Port disconnected', port);

      if (port === this.devPort) {
        this.portConnected = false;
      }
    });

    this.socket = new WebSocketService();

    this.socket.setState(DeviceState.GET_KEY);

    this.socket.sentRemotePacket$().subscribe((bytes) => {
      const str = JSON.stringify(bytes, null, 2);
      this.logWs(str, '','[WS REMOTE] SENT: ID');
    })

    this.socket.rcvRemotePacket$().subscribe((resp) => {
      resp = JSON.parse(resp);
      const str = JSON.stringify(resp, null, 2);
      this.logWs(str, '','[WS REMOTE] RCVD: ID');
    });

    this.socket.sentPacket$().subscribe((bytes) => {
      const socket = bytes.socket;
      delete bytes.socket;
      const str = JSON.stringify(bytes, null, 2);
      this.logWs(str, socket, '[WS LOCAL] SENT: SOCKET');
    });

    this.socket.rcvPacket$().subscribe((obj) => {
      const socket = obj.socket;
      const str = obj.str;
      this.logWs(str, socket, '[WS LOCAL] RCVD: SOCKET');
    });
  }

  public async deviceSelectionOnClick() {
    this.start();

    this.ble.sentPacket$().subscribe((bytes) => {
      const str = Cast.bytesToHex(new Uint8Array(bytes));
      this.logBle(str, '[BLE] SEND');
    });

    this.ble.rcvPacket$().subscribe((bytes) => {
      const str = Cast.bytesToHex(new Uint8Array(bytes));
      this.logBle(str, '[BLE] RCVD');
    });

    this.ble.rcvParsed$().subscribe((bytes) => {
      const str = JSON.stringify(bytes, null, 2);
      this.logBle(str, '[BLE] DECODED');
    });

    await this.ble.find();
    console.log(this.wifiSsid);
    console.log(this.wifiPassword);
    console.log(this.product);
    this.deviceSelected = true;
  }

  private logWs(str, socket, info: string) {
    const date = new Date();
    const dateStr = `[${date.toLocaleTimeString()}] ${info} ${socket}`;
    Log.yellow(dateStr, this.term);

    const buf1 = Cast.stringToBytes(dateStr);
    const buf2 = Cast.stringToBytes(str + '\n\r');
    let buffer = new Uint8Array(buf1.length + buf2.length);
    buffer.set(buf1);
    buffer.set(buf2, buf1.length);
    this.loggerIndex += buf1.length + buf2.length;

    try {
      Log.white(str, this.term);
      this.logTerm(buffer);
    } catch (error) {
      Log.red(str, this.term);
    }
  }

  private logBle(str: string, info: string) {
    const date = new Date();
    const dateStr = `[${date.toLocaleTimeString()}] ${info}:`;
    Log.blue(dateStr, this.term);

    const buf1 = Cast.stringToBytes(dateStr);
    const buf2 = Cast.stringToBytes(str + '\n\r');
    let buffer = new Uint8Array(buf1.length + buf2.length);
    buffer.set(buf1);
    buffer.set(buf2, buf1.length);
    this.loggerIndex += buf1.length + buf2.length;

    try {
      Log.white(str, this.term);
      this.logTerm(buffer);
    } catch (error) {
      Log.red(str, this.term);
    }
  }

  //TODO: disconnect after getting IP
  public async scanWifiOnClick() {
    try {
      // await this.ble.connect();
      // await this.ble.getService();
      // await this.ble.getCharacteristics();
      await this.ble.startBle();
      await this.ble.scanWifi(15);
      await this.ble.disconnect();
    } catch (err) {
      console.log(err);
    }
  }

  public async findMeOnClick() {
    // await this.ble.connect();
    // await this.ble.getService();
    // await this.ble.getCharacteristics();
    await this.ble.startBle();
    await this.ble.findMe();
    await this.ble.disconnect();
  }

  public async connectToWifiOnClick(ssid, pswd, bssid) {
    this.wifiSsid = ssid;
    this.wifiPassword = pswd;
    this.wifiBssid = bssid;

    await this.ble.connect();
    await this.ble.getService();
    await this.ble.getCharacteristics();
    await this.ble.connectToWifi(this.wifiSsid, this.wifiPassword, this.wifiBssid);
    this.ip = this.ble.getIp();
    console.log(this.ip)
    this.auth = new AuthService();
    await this.ble.disconnect();
    this.operation = Operation.AUTH;
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
            this.customPacket = ans.packet;
          }
        }
      ]
    });
  
    await alert.present();

    await this.ble.connect();
    await this.ble.getService();
    await this.ble.getCharacteristics();
    await this.ble.custom(this.customPacket);
    await this.ble.disconnect();

    this.customPacket = '';
  }

  public isBleConnected() {
    return this.ble.isConnected();
  }

  public isConnectedToWifi() {
    return this.ip !== '' ? true : false;
  }

  public async getKey() {
    this.myPubKey = this.auth.getPubKey();
    this.myPubKeyPem = forge.pki.publicKeyToPem(this.auth.getPubKey());
    this.myPrivKeyPem = forge.pki.privateKeyToPem(this.auth.getPrivKey());
    this.myPrivKey = this.auth.getPrivKey();

    const request = {
      "key": this.myPubKeyPem
    };

    const resp = await this.socket.localRequest(`ws://${this.ip}/get_key`, request, this.myPrivKey);
    console.log(resp);

    this.devicePublicKey = importPubKeyRSA(JSON.parse(resp).key);

    printPubKeyRSA(this.devicePublicKey);

    this.socket.setState(DeviceState.SEND_CMD);

    if (this.devicePublicKey !== undefined) {
      this.gotKey = true;
    } else {
      this.gotKey = false;
    }
  }

  public async setSecret() {
    this.secret = uint8ArrayToHexString(window.crypto.getRandomValues(new Uint8Array(16)));
    let secretRequest = { 
      'secret': this.secret,
      'key': this.myPubKeyPem
    };
    
    this.socket.setState(DeviceState.SEND_CMD);

    const resp = await this.socket.localRequest(`ws://${this.ip}/set_secret`, secretRequest, this.myPrivKey, this.devicePublicKey);
    const msg = JSON.parse(resp).mg;

    if (msg === 'success') {
      this.secretSet = true;
     } else {
      this.secretSet = false;
     }
  }

  public async registerDevice(place: string, addr: string, env: string, app: string) {
    // const refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIwZDU4YmIzYy1hNzZjLTQwYzEtYjA4ZS01MjJkOGQwMmE1ZjUifQ.eyJqdGkiOiJiZmI4ZTA1MC0zMGE0LTQyMmItOTc5Ni0xMzEzMzQ3YjRjMTUiLCJleHAiOjAsIm5iZiI6MCwiaWF0IjoxNjI1NzQ4MDkwLCJpc3MiOiJodHRwczovL3N0YWdlLnBhZG90ZWMuY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJhdWQiOiJodHRwczovL3N0YWdlLnBhZG90ZWMuY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJzdWIiOiJkZTFjMmIyMy1hNGM0LTRiYzQtYjQ2Ni0zNTM4OTVmNTgxOTAiLCJ0eXAiOiJPZmZsaW5lIiwiYXpwIjoiaGF1c2Vubi1jbGllbnQtYXBwIiwiYXV0aF90aW1lIjowLCJzZXNzaW9uX3N0YXRlIjoiMTM5MzAyZjgtZDBhZC00ZjFjLWJlOWQtOTRlYjdkMGNhNTJmIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBvZmZsaW5lX2FjY2VzcyBlbWFpbCBwcm9maWxlIn0.TqvywFzLXqEYZHCi1w4EAwFNQPfGPyfA14IJ5Bu_bac";
    this.token = await getAccessToken(this.refreshToken);
    const user = await sync(this.token);
    const placeId = await createPlace(this.token, place, addr);
    const envId = await createEnvironment(this.token, placeId, env);
    const dev = await createDevice(this.secret, this.token, envId, app, this.ip, '12:23:34:45:56:67', '12:23:34:45:56:69', this.wifiSsid, 'one', forge.pki.publicKeyToPem(this.devicePublicKey));
    this.userTicket = user[1];
    this.userUuid = user[0];
    this.deviceTicket = dev[0];
    this.deviceUuid = dev[1];
    this.deviceToken = dev[2];

    console.log(this.deviceTicket);
    console.log(this.deviceUuid);
    console.log(this.deviceToken);

    if (dev !== undefined) {
      this.deviceRegistered = true;
    } else {
      this.deviceRegistered = false;
    }

    this.remoteRequest = {
      'payload': {
        'macToken': this.deviceToken,
      },
      'sender': this.userUuid,
      'recipient': this.deviceUuid,
    };
  }

  public async setTicket() {
    let ticketRequest = { 
      'ticket': this.deviceTicket,
      'uuid': this.deviceUuid,
      'key': this.myPubKeyPem
    };
    
    const resp = await this.socket.localRequest(`ws://${this.ip}/set_ticket`, ticketRequest, this.myPrivKey, this.devicePublicKey);
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

    this.socket.localRequest(`ws://${this.ip}/findme`, request);

    this.socket.setState(DeviceState.SEND_CMD);
  }

  public async facResetWsHandler() {
    let request = { 
      'fac_reset': 'true',
    };
    
    this.socket.setState(DeviceState.FIND_ME);

    this.socket.localRequest(`ws://${this.ip}/fac_reset`, request);
  }

  public enableTesting() {
    this.manualLocalTest = new OneLocalTestingService(this.ip, this.myPubKeyPem, this.myPrivKey, this.devicePublicKey, this.deviceToken, this.socket);
    this.manualRemoteTest = new OneRemoteTestingService(this.userTicket, this.remoteRequest, this.socket);
    this.luminaLocalTest = new LuminaLocalTestingService(this.ip, this.myPubKeyPem, this.myPrivKey, this.devicePublicKey, this.deviceToken, this.socket);
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
    return (this.ip === '' ? true : false) || this.isStateTesting();
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

  public getAllOnClick() {
    this.luminaLocalTest.GET_ALL();
  }

  public getStatusOnClick(ch: number) {
    this.luminaLocalTest.GET_STATUS(ch);
  }

  public setChOnClick(ch: number) {
    this.luminaLocalTest.SET_STATUS_ON(ch);
  }

  public resetChOnClick(ch: number) {
    this.luminaLocalTest.SET_STATUS_OFF(ch);
  }

  public async toggleChOnClick(ch: number, index: number, delay: number) {
    for(let i = 0; i < index; i++) {
      this.luminaLocalTest.SET_STATUS_ON(ch);
      await timeout_ms(delay*1000);
      this.luminaLocalTest.SET_STATUS_OFF(ch);
      await timeout_ms(delay*1000);
    }
  }

  public showKeyPairOnClick() {
    const date = new Date();
    const dateStr = `[${date.toLocaleTimeString()}] [KEYS]:\n\r`;
    Log.white(dateStr, this.term);
    Log.white(this.myPubKeyPem, this.term);
    Log.white(this.myPrivKeyPem, this.term);
    Log.white('DEVICE_KEY:\n\r', this.term);
    Log.white(this.devicePublicKey, this.term);
  }

  public async onConnectDevice() {
    this.devPort = await this.open();

    if (this.devPort) {
      this.portConnected = true;
      const date = new Date();
      const dateStr = `[${date.toLocaleTimeString()}] [SERIAL] Connected to serial port\n\r`;
      Log.green(dateStr, this.term);

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

    this.reader = await this.devPort.readable.getReader();
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
      console.error(error);
    } finally {
      this.reader.releaseLock();
    }
  }

  public async onDisconnectDevice() {
    this.portConnected = false;
    await this.close(this.devPort);

    const date = new Date();
    const dateStr = `[${date.toLocaleTimeString()}] [SERIAL] Serial port disconnected\n\r`;
    Log.yellow(dateStr, this.term);

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

  public getOperation() {
    return this.operation;
  }

  public getDevTicket() {
    return this.deviceTicket;
  }

  public getUserUuid() {
    return this.userUuid;
  }

  public getDevUuid() {
    return this.deviceUuid;
  }

  public getMyPubKeyPem() {
    if (this.myPubKey) {
      return this.myPubKeyPem;
    }
    return '';
  }

  public getMyPrivKeyPem() {
    if (this.myPrivKey) {
      return this.myPrivKey;
    }
    return '';
  }

  public getMyPrivKey() {
    return this.myPrivKey;
  }

  public getDevPubKeyPem() {
    if (this.devicePublicKey) {
      return this.devicePublicKey;
    }
    return '';
  }

  public getToken() {
    return this.deviceToken;
  }

  public getIp() {
    return this.ip;
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
    return this.userTicket;
  }

  public setToken(token) {
    this.token = token;
  }

  private start() {
    this.deviceSelected = false;
    this.ble = new BluetoothService(this.bleMac);
    this.ip = '';
    this.auth = null;
    this.manualLocalTest = null;
    this.manualRemoteTest = null;
    this.local = true;
    this.remoteRequest = null;
  
    this.devicePublicKey = null;
    this.secret = null;
    this.deviceTicket = null;
    this.deviceUuid = null;
    this.userTicket = null;
    this.userUuid = null;
    this.gotKey = false;
    this.secretSet = false;
    this.ticketSet = false;
    this.deviceRegistered = false;
  
    // testing
    this.deviceToken = null;
    this.myPubKey = null; 
    this.myPubKeyPem = null; 
    this.myPrivKey = null;
    this.myPrivKeyPem = null;
  
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
