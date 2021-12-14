import { WifiModeType } from "./wifi-response-modes.enum";
import { uint8ArrayToHexString } from "../../utils/utils";
import { Cast } from '../../utils/cast';
import { auth } from "./wifi-auth-modes.enum";
import { ciph } from "./wifi-cipher-types.enum";

export class PacketResponse {
  private m_mode: number;
  private m_rslt: string;
  private m_data: Uint8Array;

  constructor(data: Uint8Array) {
    this.m_mode = data[0];
    this.m_data = data;
  }

  public async parse() {
    switch (this.m_mode) {
      case WifiModeType.DONE: {
        console.log('DONE');
        return await this._createDoneResponse();
      }

      case WifiModeType.WIFI_SCAN: {
        console.log('WIFI_SCAN');
        return await this._createScanResponse();
      }

      case WifiModeType.WIFI_CONN: {
        console.log('WIFI_CONN');
        return await this._createConnResponse();
      }

      case WifiModeType.FIND_ME: {
        console.log('FIND_ME');
        break;
      }

      default: {
        console.log('INVALID BLE RESPONSE MODE');
        break;
      }
    }
  }

  private _createDoneResponse(): Promise<any> {
    return new Promise(resolve => {
      resolve(this.m_data[1] == 0 ? 'ERR_OK': 'ERR_FAIL');
    });
  }

  private _createScanResponse(): Promise<any> {
    return new Promise(resolve => {
      console.log(this.m_data);
      // const ssid = Cast.bytesToString(new Uint8Array(this.m_data.subarray(4, this.m_data.length - 4)));
      // const rssi = this.m_data.subarray(this.m_data.length - 3, this.m_data.length - 2)[0];
      // const authIndex = this.m_data.subarray(this.m_data.length - 2, this.m_data.length - 1)[0];
      // const ciphIndex = this.m_data.subarray(this.m_data.length - 1, this.m_data.length)[0];

      const ssid = Cast.bytesToString(new Uint8Array(this.m_data.subarray(4, this.m_data.length - 10)));
      // this.m_data.subarray(this.m_data.length - 10, this.m_data.length - 9) is the 0 to sinalize end of ssid
      const rssi = this.m_data.subarray(this.m_data.length - 9, this.m_data.length - 8)[0];
      const authIndex = this.m_data.subarray(this.m_data.length - 8, this.m_data.length - 7)[0];
      const ciphIndex = this.m_data.subarray(this.m_data.length - 7, this.m_data.length - 6)[0];
      const bssid = Cast.bytesToHex(this.m_data.subarray(this.m_data.length - 6, this.m_data.length));

      const res = {
        'n': this.m_data[2], 
        'ap': this.m_data[3], 
        'ssid': ssid,
        'rssi': rssi - 256,
        'auth': auth[authIndex],
        'ciph': ciph[ciphIndex],
        'bssid': bssid,
      };
      resolve(res);
    });

    // TODO: print all APs correctly until n == ap
  }

  private _createConnResponse(): Promise<any> {
    return new Promise(resolve => {
      const res = {
        'reg': this.m_data[2] === 0x01 ? 'registered' : 'not registered', //data.substring(4,6),
        'ip': this._hex2ip(uint8ArrayToHexString(this.m_data.subarray(3, 7))), //data.substring(6, 14),
        'ipmac': uint8ArrayToHexString(this.m_data.subarray(7, 13))
      };
      console.log(res);
      resolve(res.ip);
    });
  }

  private checkResponse(resp: Uint8Array) {
    // TODO for automated tests
  }

  private _hex2ip(hex) {
    var ip = '';
  
    for(let i = 0; i < hex.length/2; i++) {
      ip += parseInt((hex).substring(i*2, (i+1)*2), 16) + '.';
    }
  
    return ip.substring(0, ip.length-1);
  }
}