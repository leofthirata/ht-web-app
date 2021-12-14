import { Packet } from "./packet";
import { Observable, Subject } from 'rxjs';

export enum bleMode {
  SCAN = 'scan',
  CONN = 'conn',
  FIND_ME = 'find_me',
  CUSTOM = 'custom',
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
  private readonly HAUSENN_READ_CHARACTERISTIC = '3b274ac1-e910-4188-95aa-452018d93750';
  private readonly HAUSENN_WRITE_CHARACTERISTIC ='bf6d9667-bd7f-4e33-a608-21520546c82d';
  private readonly HAUSENN_SERVICE_UUID = '000075a5-0000-1000-8000-00805f9b34fb';

  private readonly BUFFER_SIZE = 1024;
  private m_buffer = new Uint8Array(this.BUFFER_SIZE);
  private m_index = 0;
  private m_rslt;
  private mode: bleMode;
  private sentPacketSubject$ = new Subject<Uint8Array>();
  private rcvPacketSubject$ = new Subject<Uint8Array>();
  private rcvParsedSubject$ = new Subject<Object>();

  public find(): Promise<boolean> {
    return new Promise(async resolve => {
      this.m_device = await navigator.bluetooth.requestDevice({
        filters: [ 
          {services: [0x75A5]}
        ] 
      });
      
      if (this.m_device) {
        console.log("[BLE] Found device");
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
        console.log("[BLE] Connected");
      } else {
        resolve(false);
        console.log("[BLE] Could not connect");
      }
    });
  }

  public disconnect(): Promise<boolean> {
    return new Promise(async resolve => {
      this.m_device.gatt.disconnect();
      console.log("[BLE] Disconnected by user");
      resolve(true);
    });
  }

  public isConnected() {
    return this.m_device.gatt.connected;
  }

  public getService(): Promise<boolean> {
    return new Promise(async resolve => {
      try {
        this.m_service = await this.m_device.gatt.getPrimaryService(this.HAUSENN_SERVICE_UUID);
        console.log(this.m_service);
        if (this.m_service) {
          console.log("svc true");
          resolve(true);
        } else {
          console.log("svc false");
          resolve(false);
        }
      } catch (err) {
        console.log('getsvc fail');
        await this.connect();
        await this.getService();
      }
    });
  }

  public getCharacteristics(): Promise<boolean> {
    return new Promise(async resolve => {
      try {
        this.m_readCharacteristic = await this.m_service.getCharacteristic(
                this.HAUSENN_READ_CHARACTERISTIC);
        this.m_writeCharacteristic = await this.m_service.getCharacteristic(
                this.HAUSENN_WRITE_CHARACTERISTIC);

        console.log(this.m_readCharacteristic);
        console.log(this.m_writeCharacteristic);
        if (this.m_readCharacteristic && this.m_writeCharacteristic) {
          console.log("chr true");
          resolve(true);
        } else {
          console.log("chr false");
          resolve(false);
        }
      } catch (err) {
        console.log('getchar fail');
        await this.connect();
        await this.getService();
        await this.getCharacteristics();
      }
    });
  }

  private _listen(): Promise<boolean> {
    return new Promise(async resolve => {
      console.log('listening');
      const notify = await this.m_readCharacteristic.startNotifications();

      let read = async ev => {
        const target = (<BluetoothRemoteGATTCharacteristic>ev.target);
        const data = new Uint8Array(target.value.buffer);
        const rslt = await this._parsePacket(data);
        this.m_rslt = rslt;
        console.log(`[BLE] Result:`);
        console.log(this.m_rslt);
  
        if (this.mode == bleMode.SCAN) {
          if ((this.m_rslt.n) && (this.m_rslt.n == this.m_rslt.ap)) {
            console.log("n == ap")
            resolve(true);
            notify.removeEventListener('characteristicvaluechanged', read);
            await this.m_readCharacteristic.stopNotifications();
          }
        }
        else if (this.mode == bleMode.CONN) {
          if (this.isIpValid(rslt)) {
            console.log("n == true")
            this.m_rslt = rslt;
            resolve(true);
            notify.removeEventListener('characteristicvaluechanged', read);
            await this.m_readCharacteristic.stopNotifications();
          }
        }
        else if (this.mode == bleMode.FIND_ME) {
            resolve(true);
            notify.removeEventListener('characteristicvaluechanged', read);
            await this.m_readCharacteristic.stopNotifications();
          }
      }
      
      notify.addEventListener('characteristicvaluechanged', read);
    });
  }

  // private _read = async ev => {
  //   return new Promise(async res => {
  //     const target = (<BluetoothRemoteGATTCharacteristic>ev.target);
  //     const data = new Uint8Array(target.value.buffer);
  //     const rslt = await this._parsePacket(data);
  //     this.m_rslt = rslt;
  //     console.log(`[BLE] Result:`);
  //     console.log(this.m_rslt);

  //     if (this.mode == bleMode.SCAN) {
  //       if ((this.m_rslt.n) && (this.m_rslt.n == this.m_rslt.ap)) {
  //         notify.removeEventListener('characteristicvaluechanged', this._listen);
  //         console.log("n == ap")
  //         resolve(true);
  //       }
  //     }
  //     else if (this.mode == bleMode.CONN) {
  //       if (this.isIpValid(rslt)) {
  //         console.log("n == true")
  //         this.m_rslt = rslt;
  //         resolve(true);
  //       }
  //     }
  //     else if (this.mode == bleMode.FIND_ME) {
  //         resolve(true);
  //     }
  //   });
  // }

  // private async _listen() {
  //   const notify = await this.m_readCharacteristic.startNotifications();
  //   notify.addEventListener('characteristicvaluechanged', this._read);
  // }

  private async _parsePacket(data: Uint8Array): Promise<string> {
    return new Promise(async resolve => {
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
        const buf = this.m_buffer.subarray(0, this.m_index);
        this.m_index = 0;
        this.m_buffer = new Uint8Array(this.BUFFER_SIZE);

        // console.log('Received packet: [' + buf.toString() + ']');

        const response = new Packet();
        const rslt = await response.decode(buf);
        console.log(response);

        this.rcvPacketSubject$.next(buf);
        this.rcvParsedSubject$.next(rslt);

        resolve(rslt);
      } 
    });
  }

  public sentPacket$(): Observable<Uint8Array> {
    return this.sentPacketSubject$.asObservable();
  }

  public rcvPacket$(): Observable<Uint8Array> {
    return this.rcvPacketSubject$.asObservable();
  }

  public rcvParsed$(): Observable<Object> {
    return this.rcvParsedSubject$.asObservable();
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
      this.setMode(bleMode.SCAN);

      const request = new Packet(bleMode.SCAN);
      console.log(request);

      const data = {
        "ap": ap,
        "ssid": null,
        "pswd": null,
        "bssid": null, 
      };

      await request.setData(data);

      const packet = request.getPackage().buffer;

      this.sentPacketSubject$.next(new Uint8Array(packet));

      this._write(packet, packet.byteLength);

      await this.m_readCharacteristic.readValue();

      await this.m_readCharacteristic.startNotifications();

      const prom = await this._listen();

      Promise.all([prom]);

      console.log('bbbbbbbbbb');

      resolve(true);
    });
  }

  public connectToWifi(ssid: string, pswd: string, bssid: string): Promise<boolean> {
    return new Promise(async resolve => {
      this.setMode(bleMode.CONN);

      const request = new Packet(bleMode.CONN);

      console.log(request);
      console.log()

      const data = {
        "ap": null,
        "ssid": ssid,
        "pswd": pswd,
        "bssid": bssid, 
      };

      await request.setData(data);

      const packet = request.getPackage().buffer;

      this.sentPacketSubject$.next(new Uint8Array(packet));

      this._write(packet, packet.byteLength);

      await this.m_readCharacteristic.readValue();

      await this.m_readCharacteristic.startNotifications();

      const prom = await this._listen();

      Promise.all([prom]);

      console.log('aaaaaaaaaaa');

      resolve(true);
    });
  }

  public findMe(): Promise<boolean> {
    return new Promise(async resolve => {
      this.setMode(bleMode.FIND_ME);

      const request = new Packet(bleMode.FIND_ME);

      console.log(request);

      await request.setData();

      const packet = request.getPackage().buffer;

      this.sentPacketSubject$.next(new Uint8Array(packet));

      this._write(packet, packet.byteLength);

      await this.m_readCharacteristic.readValue();

      await this.m_readCharacteristic.startNotifications();

      const prom = await this._listen();

      Promise.all([prom]);

      console.log('cccccccccc');

      resolve(true);
    });
  }

  public custom(data): Promise<boolean> {
    return new Promise(async resolve => {
      this.setMode(bleMode.CUSTOM);

      const request = new Packet(bleMode.CUSTOM);

      console.log(request);

      await request.setData(data);

      const packet = request.getPackage().buffer;

      this.sentPacketSubject$.next(new Uint8Array(packet));

      this._write(packet, packet.byteLength);

      await this.m_readCharacteristic.readValue();

      await this.m_readCharacteristic.startNotifications();

      await this._listen();

      resolve(true);
    });
  }

  public getIp() {
    return this.m_rslt;
  }

  private isIpValid(ip: string) {  
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {  
      console.log('valid ip');
      return true;  
    } else {
      return false;
    } 
  } 

  private setMode(mode: bleMode) {
    this.mode = mode;
  }
}