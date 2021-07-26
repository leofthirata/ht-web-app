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

  private readonly BUFFER_SIZE = 1024;
  private m_buffer = new Uint8Array(this.BUFFER_SIZE);
  private m_index = 0;
  private m_rslt;

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

  private _listen(): Promise<boolean> {
    return new Promise(async resolve => {
      console.log('listening');
      const notify = await this.m_readCharacteristic.startNotifications();
      notify.addEventListener('characteristicvaluechanged', this._read.bind(this));
      resolve(true);
    });
  }

  private async _read(event) {
    const data = new Uint8Array(event.target.value.buffer);
    await this._parsePacket(data);
  }

  private async _parsePacket(data: Uint8Array): Promise<void> {
    this.m_buffer.set(data, this.m_index);
    this.m_index += data.length;
    
    if (this.m_buffer[0] != 0x75 || this.m_buffer[1] != 0xa5) {
      this.m_index = 0;
      console.warn('Dropped packet: [' + data.toString() + ']');
    }

    // End of packet, assemble  and report.
    if (
      this.m_buffer[this.m_index - 2] == 0xa5 &&
      this.m_buffer[this.m_index - 1] == 0xd5
    ) {
      console.log('Received packet: [' + this.m_buffer.subarray(0, this.m_index).toString() + ']');
      const id = this.m_index;
      this.m_index = 0;

      const response = new Packet();
      this.m_rslt = await response.decode(this.m_buffer.subarray(0, id));
      console.log(this.m_rslt);
    } 
  }

  private _write(buffer: ArrayBuffer, length: number): Promise<void> {
    return new Promise(async resolve => {
      for (let i = 0; i < length/16; i++) {
        await this.m_writeCharacteristic.writeValue(buffer.slice(i*16, (i+1)*16));
      }
    });
  }

  public scanWifi(ap: number): Promise<boolean> {
    return new Promise(async resolve => {
      const request = new Packet(bleMode.SCAN);

      console.log(request);

      const data = {
        "ap": ap,
        "ssid": null,
        "pswd": null 
      }

      await request.setData(data);

      this._write(request.getPackage().buffer, request.getPackage().byteLength);

      await this.m_readCharacteristic.readValue();
      
      await this._listen();
      
      resolve(true);
    });
  }

  public connectToWifi(ssid: string, pswd: string): Promise<boolean> {
    return new Promise(async resolve => {
      const request = new Packet(bleMode.CONN);

      console.log(request);

      const data = {
        "ap": null,
        "ssid": ssid,
        "pswd": pswd 
      }

      await request.setData(data);

      this._write(request.getPackage().buffer, request.getPackage().byteLength);

      await this.m_readCharacteristic.readValue();

      await this._listen();

      resolve(true);
    });
  }

  public findMe(): Promise<boolean> {
    return new Promise(async resolve => {
      const request = new Packet(bleMode.FIND_ME);

      console.log(request);

      await request.setData();

      this._write(request.getPackage().buffer, request.getPackage().byteLength);

      await this.m_readCharacteristic.readValue();

      await this._listen();

      resolve(true);
    });
  }

  public getIp() {
    return this.m_rslt;
  }

}