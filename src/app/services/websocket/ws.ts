import { encryptRSA, decryptRSA } from "../../utils/encrypt";
import { Observable, Subject } from 'rxjs';
import { uint8ArrayToHexString } from '../../utils/utils';
import { Cast } from '../../utils/cast';

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

  private isOpen = false;

  constructor() {}

  public open(uri: string, privKey?): Promise<boolean> {
      this.m_uri = uri;
      this.m_privKey = privKey;

      return new Promise(resolve => {
        while(this.isOpen) {
          this.m_ws.close();
        }

        this.m_ws = new WebSocket(uri);

        this.m_ws.onopen = async event => {
          console.log(event);
          this.isOpen = true;
          resolve(true);

          await setTimeout(() => {
            this.m_ws.close();
          }, 10000);
        };

        this.m_ws.onerror = error => {
          console.log(error);
          resolve(false);
        }

        this.m_ws.onclose = event => {
          console.log(event);
          this.isOpen = false;
        }
      });
  }

  public localRequest(uri: string, request: any, privKey?, devicePublicKey?): Promise<string> {
    return new Promise(async resolve => {
      try {
        this.m_uri = uri;

        var ok = false;
        var tries = 0;
        while(!ok) {
          try {
            ok = await this.open(this.m_uri);
          } catch (err) {
            tries++;
            if (tries == 5) {
              throw new Error('[WS] Failed to open local session');
            }
          }
        }

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
          this.m_ws.close();
          resolve(resp);
        }
      } catch (err) {
        console.log(err);
        throw err;
      }
    });
  }
  
  private send(request) {
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
      const bytes = Cast.stringToBytes(payload);
      buffer.set(bytes, i * 128);
    }

    return buffer;
  }

  private decryptWebsocketJSON(payload: Uint8Array) {
    const blocks = Math.ceil(payload.length / 128);

    let buffer = '';

    for (let i = 0; i < blocks; i++) {
      const slice = payload.slice(i*128, (i+1)*128);
      const str = Cast.bytesToString(slice);
      const data = decryptRSA(str, this.m_privKey);//.decrypt(str);
      buffer = buffer + data;
    }

    return buffer;
  }

  public remoteRequest(uri: string, request: any): Promise<string> {
    return new Promise(async resolve => {
      try {
        this.m_uri = uri;

        var ok = false;
        var tries = 0;
        while(!ok) {
          try {
            ok = await this.open(this.m_uri);
          } catch (err) {
            tries++;
            if (tries == 5) {
              throw new Error('[WS] Failed to open remote session');
            }
          }
        }

        request.messageId = Math.ceil(Math.random()*1000 + 1);

        this.m_ws.send(JSON.stringify(request));

        const obsData = request;
        this.sentRemotePacketSubject$.next(obsData);
    
        this.m_ws.binaryType = 'arraybuffer';
        this.m_ws.onmessage = event => {
          const resp = event.data
          console.log(resp);
          this.rcvRemotePacketSubject$.next(resp);
          this.m_ws.close();
          resolve(resp);
        }
      } catch (err) {
        console.log(err);
        throw err;
      }
    });
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
}