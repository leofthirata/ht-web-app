import { str2arr, arr2str, ascii2hex, str2ArrayBuffer, concatBuffers, pack } from "../../utils/utils";
import { crc8 } from "../../utils/crc8";
import { encrypt } from "../../utils/encrypt";
import { Packet } from "./packet";
import { ɵINTERNAL_BROWSER_PLATFORM_PROVIDERS } from "@angular/platform-browser";

export enum bleMode {
  SCAN = 'scan',
  CONN = 'conn',
  FIND_ME = 'find_me'
}

export class BluetoothService {
  constructor(mac: string) {
    this.m_mac = mac;
    this.m_name = `${mac.substring(mac.length-4, mac.length-2)}:${mac.substring(mac.length-2, mac.length)}`;
  }
  private m_mac: string;
  private m_name: string;
  private m_ble: Bluetooth;
  private m_device: BluetoothDevice;
  private m_server: BluetoothRemoteGATTServer;
  private m_service: BluetoothRemoteGATTService;
  private m_readCharacteristic: BluetoothRemoteGATTCharacteristic;
  private m_writeCharacteristic:BluetoothRemoteGATTCharacteristic;

  public find(): Promise<boolean> {
    return new Promise(async resolve => {
      this.m_device = await navigator.bluetooth.requestDevice({
        // acceptAllDevices: true
        filters: [ 
          {name: `Hausenn ONE:${this.m_name}`},
          {services: [0x75A5]}
        ] 
      });

      // this.m_device.addEventListener('advertisementreceived', (event) => {
      //   console.log('> Received advertisement from "' + this.m_device.name + '"...');
      // });
      // await this.m_device.watchAdvertisements();
          
      if (this.m_device) {
        console.log("find true");
        resolve(true);
      } else {
        console.log("find false");
        resolve(false);
      }
    });
  }

  public connect(): Promise<boolean> {
    return new Promise(async resolve => {
      this.m_server = await this.m_device.gatt.connect();
      if (this.m_server) {
        resolve(true);
        console.log("conn true");
      } else {
        resolve(false);
        console.log("conn false");
      }
    })
  }

  public disconnect(): Promise<boolean> {
    return new Promise(async resolve => {
      await this.m_device.gatt.disconnect();
      console.log("disc");
      resolve(true);
    });
  }

  public getService(): Promise<boolean> {
    return new Promise(async resolve => {
      this.m_service = await this.m_device.gatt.getPrimaryService('000075a5-0000-1000-8000-00805f9b34fb');
      console.log(this.m_service);
      if (this.m_service) {
        console.log("svc true");
        resolve(true);
      } else {
        console.log("svc false");
        resolve(false);
      }
    });
  }

  public getCharacteristics(): Promise<boolean> {
    return new Promise(async resolve => {
      this.m_readCharacteristic = await this.m_service.getCharacteristic(
              '3b274ac1-e910-4188-95aa-452018d93750');
      this.m_writeCharacteristic = await this.m_service.getCharacteristic(
        'bf6d9667-bd7f-4e33-a608-21520546c82d');

      console.log(this.m_readCharacteristic);
      console.log(this.m_writeCharacteristic);
      if (this.m_readCharacteristic && this.m_writeCharacteristic) {
        console.log("chr true");
        resolve(true);
      } else {
        console.log("chr false");
        resolve(false);
      }
    });
  }

  public listen(): Promise<boolean> {
    return new Promise(async resolve => {
      console.log('listening');
      const notify = await this.m_readCharacteristic.startNotifications();
      notify.addEventListener('characteristicvaluechanged', this._read);
      resolve(true);
    });
  }

  private _read(event) {
    const data = new Uint8Array(event.target.value.buffer);
    console.log(data);
  }

  private _write(buffer: ArrayBuffer, length: number): Promise<void> {
    return new Promise(async resolve => {
      console.log(buffer);
      for (let i = 0; i < length/16; i++) {
        await this.m_writeCharacteristic.writeValue(buffer.slice(i*16, (i+1)*16));
        console.log('aa');
      }
    });
  }

  public scanWifi(ap: number): Promise<boolean> {
    return new Promise(async resolve => {
      const request = new Packet(bleMode.SCAN);
      const data = {
        "ap": ap,
        "ssid": null,
        "pswd": null 
      }
      await request.setData(data);
      console.log(request);
      this._write(request.getPackage().buffer, request.getPackage().byteLength);
      await this.m_readCharacteristic.readValue();
      this.listen();
      resolve(true);
    });
  }

  // private _createWifiScanCmd(ap: number): Number[] {
  //   return [0x01, ap];
  // }

  // private _createWifiConnCmd(ssid: String, pswd: String): Number[] {
  //   let cmd = str2arr('02' + ascii2hex(ssid) + '00' + ascii2hex(pswd) + '00');

  //   for(let i = 0; i < 12; i++) {
  //     cmd[cmd.length] = 0x00;
  //   }

  //   return cmd;
  // }

  // private _createFindMeCmd(): Number[] {
  //   return [0x03, 0x00];
  // }

  // private async _createRequest(cmd) {
  //   let crc = crc8(cmd);

  //   let cmd_crc = arr2str(cmd) + (crc < 10 ? '0' + crc.toString(16) : crc.toString(16));

  //   const key = '02E596CDAB2D81320A94BFD6D52BAFAE';

  //   let data = await encrypt(cmd_crc, key);

  //   let length = Math.ceil(cmd_crc.length/32) + '0';

  //   let pack = concatBuffers(header, str2ArrayBuffer(length));
  //   pack = concatBuffers(pack, data.package);
  //   pack = concatBuffers(pack, tail);

  //   let request = {
  //     'value': pack,
  //     'header': header,
  //     'iv': data.iv,
  //     'data': cmd,
  //     'crc': crc,
  //     'enc': data.enc,
  //     'tail': tail,
  //     'key': key.toString()
  //   };

  //   console.log("Request to be sent:");
  //   console.log(request);

  //   return request;
  // } 

  // public createRequest()

  // public write()
}