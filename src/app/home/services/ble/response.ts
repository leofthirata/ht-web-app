import { WifiModeType } from "./wifi-response-modes.enum";
import { uint8ArrayToHexString } from "../../utils/utils";

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
        return await this._createDoneResponse();
      }

      case WifiModeType.WIFI_SCAN: {
        return await this._createScanResponse();
      }

      case WifiModeType.WIFI_CONN: {
        return await this._createConnResponse();
      }

      case WifiModeType.FIND_ME: {
        console.log('FIND_ME');
        break;
      }

      default: {
        console.log('DEFAULT');
        break;
      }
    }
  }

  private _createDoneResponse(): Promise<any> {
    console.log('DONE');
    return new Promise(resolve => {
      resolve(this.m_data[1] == 0 ? 'ERR_OK': 'ERR_FAIL');
    });
  }

  private _createScanResponse(): Promise<any> {
    console.log('WIFI_SCAN');
    return new Promise(resolve => {
      console.log(this.m_data);
      const ciph = this.m_data.subarray(this.m_data.length - 1, this.m_data.length);
      const auth = this.m_data.subarray(this.m_data.length - 2, this.m_data.length - 1);
      const rssi = this.m_data.subarray(this.m_data.length - 3, this.m_data.length - 2);
      const ssid = this.m_data.subarray(4, this.m_data.length - 4);

      var string1 = new TextDecoder().decode(ciph);
      console.log(string1);
      var string2 = new TextDecoder().decode(auth);
      console.log(string2);
      var string3 = new TextDecoder().decode(rssi);
      console.log(string3);
      var string4 = new TextDecoder().decode(ssid);
      console.log(string4);

      const res = {
        'n': this.m_data[2], //parseInt(data.substring(4, 6))
        'ap': this.m_data[3], //parseInt(data.substring(6, 8)),
        'ssid': new TextDecoder().decode(this.m_data.subarray(4, this.m_data.length - 4)),
        'rssi': new TextDecoder().decode(this.m_data.subarray(this.m_data.length - 3, this.m_data.length - 2)),
        'auth': new TextDecoder().decode(this.m_data.subarray(this.m_data.length - 2, this.m_data.length - 1)),
        'ciph': new TextDecoder().decode(this.m_data.subarray(this.m_data.length - 1, this.m_data.length)),
      };
      console.log(res);
      resolve(res);
    });
    // TODO: print rssi, authmode and cipher correctly
  }

  private _createConnResponse(): Promise<any> {
    console.log('WIFI_CONN');
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
    
  }

  private _hex2ip(hex) {
    var ip = '';
  
    for(let i = 0; i < hex.length/2; i++) {
      ip += parseInt((hex).substring(i*2, (i+1)*2), 16) + '.';
    }
  
    return ip.substring(0, ip.length-1);
  }
}