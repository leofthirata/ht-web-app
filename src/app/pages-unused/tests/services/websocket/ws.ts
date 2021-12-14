import { Terminal } from "xterm";
import { encryptRSA, decryptRSA } from "../../utils/encrypt";
import { hex2ascii, str2Uint8arr } from "../../utils/utils"; 
import * as Colors from '../../utils/color';
import { Cast } from '../../utils/cast';
import { Observable, Subject } from 'rxjs';
import { uint8ArrayToHexString } from '../../utils/utils';

declare const Buffer;

export enum DeviceState {
  GET_KEY = 0x00,
  SET_SECRET = 0x01,
  SET_TICKET = 0x02,
  SEND_CMD = 0x03,
  FIND_ME = 0x04,
}

export class WebSocketService {
  private m_ws: WebSocket;
  private m_uri: string;
  private m_state: DeviceState;
  private readonly RSA_BLOCK_SIZE_HEX = 117;
  private readonly RSA_BLOCK_SIZE_B64 = 256;
  private m_privKey;
  private m_devicePublicKey;

  private sentPacketSubject$ = new Subject<any>();
  private rcvPacketSubject$ = new Subject<any>();

  private sentRemotePacketSubject$ = new Subject<any>();
  private rcvRemotePacketSubject$ = new Subject<any>();

  constructor() {}

  public open(uri: string, privKey?): Promise<boolean> {
      this.m_uri = uri;
      this.m_privKey = privKey;

      return new Promise(resolve => {
          this.m_ws = new WebSocket(uri);

          this.m_ws.onopen = event => {
              console.log('open:\n');
              console.log(event);
              resolve(true);
          };
  
          this.m_ws.onerror = error => {
              console.log('error:\n');
              console.log(error);
              resolve(false);
          }
      });
  }

  // public send(data, devicePublicKey?): Promise<string> {
  //   if (devicePublicKey) {
  //     this.m_devicePublicKey = devicePublicKey;
  //   }
  //   const socket = uint8ArrayToHexString(window.crypto.getRandomValues(new Uint8Array(8)));
  //   const obsData = data;
  //   obsData.socket = socket;
  //   this.sentPacketSubject$.next(obsData);

  //   return new Promise(resolve => {
  //     console.log(this.m_state);
  //     switch (this.m_state) {
  //       case DeviceState.FIND_ME: {
  //         console.log(data);
  //         this.m_ws.send(JSON.stringify(data));
  //         break;
  //       }
  //       case DeviceState.GET_KEY: {
  //         console.log(data);
  //         this.m_ws.send(JSON.stringify(data));
  //         break;
  //       }
  //       case DeviceState.SEND_CMD: {
  //         this.m_ws.send(this._encryptWebsocketJSON(JSON.stringify(data)));
  //         break;
  //       }
  //       default: {
  //         break;
  //       }
  //     }
  //     resolve(socket); 
  //   });
  // }

  // public receive(socket: string): Promise<string> {
  //   return new Promise(resolve => {
  //     this.m_ws.binaryType = 'arraybuffer';
  //     this.m_ws.onmessage = event => {
  //       if (this.m_state == DeviceState.FIND_ME) {
  //         const resp = event.data.toString();
  //         const obsResp = resp;
  //         obsResp.socket = socket;
  //         this.rcvPacketSubject$.next(obsResp);
  //         console.log(resp);
  //         resolve(resp);
  //       } else {
  //         const decrypted = this.decryptWebsocketJSON(new Uint8Array(event.data));
  //         const obsResp = {
  //           'str': decrypted,
  //           'socket': socket,
  //         };
  //         this.rcvPacketSubject$.next(obsResp);
  //         resolve(decrypted);
  //       }
  //     }
  //   });
  // }

  public localRequest(uri: string, request: any, privKey?, devicePublicKey?): Promise<string> {
    return new Promise(async resolve => {
      try {
        this.m_uri = uri;

        await this.open(this.m_uri);

        this.m_devicePublicKey = devicePublicKey;
        this.m_privKey = privKey;

        this.send(request);

        const socket = uint8ArrayToHexString(window.crypto.getRandomValues(new Uint8Array(8)));
        const obsData = request;
        obsData.socket = socket;
        this.sentPacketSubject$.next(obsData);

        this.m_ws.binaryType = 'arraybuffer';
        this.m_ws.onmessage = event => {
          const resp = this.receive(event.data, socket);
          console.log(resp);
          resolve(resp);
        }
      } catch (err) {
        console.log(err);
      }
    });
  }
  
  private send(request) {
    console.log(this.m_state);
    switch (this.m_state) {
      case DeviceState.FIND_ME: {
        console.log(request);
        this.m_ws.send(JSON.stringify(request));
        break;
      }
      case DeviceState.GET_KEY: {
        console.log(request);
        this.m_ws.send(JSON.stringify(request));
        break;
      }
      case DeviceState.SEND_CMD: {
        this.m_ws.send(this._encryptWebsocketJSON(JSON.stringify(request)));
        break;
      }
      default: {
        break;
      }
    }
  }

  private receive(data, socket): string {
    console.log(data);

    if (this.m_state == DeviceState.FIND_ME) {
      const resp = data.toString();
      const obsResp = resp;
      obsResp.socket = socket;
      this.rcvPacketSubject$.next(obsResp);
      console.log(resp);
      return resp;
    } else {
      const decrypted = this.decryptWebsocketJSON(new Uint8Array(data));
      const obsResp = {
        'str': decrypted,
        'socket': socket,
      };
      this.rcvPacketSubject$.next(obsResp);
      console.log(obsResp);
      return decrypted;
    }
  }

  private _encryptWebsocketJSON(data: string): Uint8Array {
    const blocks = Math.ceil(data.length / 117);
    const buffer = new Uint8Array(blocks * 128);

    for (let i = 0; i < blocks; i++) {
      const end = Math.min((i + 1) * 117, data.length);
      const slice = data.substring(i * 117, end);
      const payload = encryptRSA(slice, this.m_devicePublicKey);
      const bytes = this.stringToBytes(payload);
      buffer.set(bytes, i * 128);
    }

    return buffer;
  }

  private decryptWebsocketJSON(payload: Uint8Array) {
    const blocks = Math.ceil(payload.length / 128);

    let buffer = '';

    for (let i = 0; i < blocks; i++) {
      const slice = payload.slice(i*128, (i+1)*128);
      const str = this.bytesToString(slice);
      const data = decryptRSA(str, this.m_privKey);//.decrypt(str);
      buffer = buffer + data;
    }

    return buffer;
  }

  public remoteRequest(uri: string, request: any): Promise<string> {
    return new Promise(async resolve => {
      this.m_uri = uri;
      await this.open(this.m_uri);

      request.messageId = Math.ceil(Math.random()*1000 + 1);

      this.m_ws.send(JSON.stringify(request));

      const obsData = request;
      this.sentRemotePacketSubject$.next(obsData);
  
      this.m_ws.binaryType = 'arraybuffer';
      this.m_ws.onmessage = event => {
        const resp = event.data
        console.log(resp);
        this.rcvRemotePacketSubject$.next(resp);
        resolve(resp);
        // this.m_ws.close();
      }
    })
  } 

  public sentPacket$(): Observable<any> {
    return this.sentPacketSubject$.asObservable();
  }

  public rcvPacket$(): Observable<any> {
    return this.rcvPacketSubject$.asObservable();
  }

  public sentRemotePacket$(): Observable<any> {
    return this.sentRemotePacketSubject$.asObservable();
  }

  public rcvRemotePacket$(): Observable<any> {
    return this.rcvRemotePacketSubject$.asObservable();
  }

  public setState(state: DeviceState) {
    this.m_state = state;
  }

  private stringToBytes(val: string): Uint8Array {
    const buffer = new Uint8Array(val.length);

    for (let i = 0; i < val.length; i++) {
      buffer[i] = val.charCodeAt(i);
    }

    return buffer;
  }

  private bytesToString(val: Uint8Array): string {
    const buffer: string[] = [];

    for (const byte of val) {
      buffer.push(String.fromCharCode(byte));
    }

    return buffer.join('');
  }

  private buf2hex(buffer: any): any {
    // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }
}