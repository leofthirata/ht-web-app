import { encryptRSA, decryptRSA } from "../../utils/encrypt";
import { hex2ascii, str2Uint8arr } from "../../utils/utils"; 

declare const Buffer;

export enum DeviceState {
  GET_KEY = 0x00,
  SET_SECRET = 0x01,
  SET_TICKET = 0x02,
  SEND_CMD = 0x03
}
export class WebSocketService {
  private m_ws: WebSocket;
  private m_uri: string;
  private m_state: DeviceState;
  private readonly RSA_BLOCK_SIZE_HEX = 117;
  private readonly RSA_BLOCK_SIZE_B64 = 256;
  private m_privKey;
  private m_devicePublicKey;

  constructor(state: DeviceState) {
    this.m_state = state;
  }

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

  public send(data: Object, devicePublicKey?): Promise<boolean> {
    if (devicePublicKey) {
      this.m_devicePublicKey = devicePublicKey;
    }

    return new Promise(resolve => {
      console.log(this.m_state);
      switch (this.m_state) {
        case DeviceState.GET_KEY: {
          this.m_ws.send(JSON.stringify(data));
          this.m_state = DeviceState.SEND_CMD;
          break;
        }
        case DeviceState.SEND_CMD: {
          this.m_ws.send(this._encryptWebsocketJSON(JSON.stringify(data)));
          break;
        }
        default: {
          break;
        }
      }
      resolve(true); 
    });
  }

  public receive(): Promise<string> {
    return new Promise(resolve => {
      this.m_ws.binaryType = 'arraybuffer';
      this.m_ws.onmessage = event => {
        const decrypted = this.decryptWebsocketJSON(new Uint8Array(event.data));
        resolve(decrypted);
      }
    });
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