import { Packet } from "./packet";
import { Observable, Subject } from 'rxjs';
import { timeout_ms } from "src/app/utils/utils";
import { HausennProducts } from "src/app/enum/hausenn-products.enum";
import { doesNotReject } from "assert";

export enum bleMode {
  SCAN = 'scan',
  CONN = 'conn',
  FIND_ME = 'find_me',
  CUSTOM = 'custom',
}

export class BluetoothService {
  private mac: string;
  private name: string;
  private ble: Bluetooth;
  private device: BluetoothDevice;
  private server: BluetoothRemoteGATTServer;
  private service: BluetoothRemoteGATTService;
  private readCharacteristic: BluetoothRemoteGATTCharacteristic;
  private writeCharacteristic:BluetoothRemoteGATTCharacteristic;
  private readonly HAUSENN_READ_CHARACTERISTIC = '3b274ac1-e910-4188-95aa-452018d93750';
  private readonly HAUSENN_WRITE_CHARACTERISTIC ='bf6d9667-bd7f-4e33-a608-21520546c82d';
  private readonly HAUSENN_SERVICE_UUID = '000075a5-0000-1000-8000-00805f9b34fb';
  
  private product = 'ONE';

  private readonly BUFFER_SIZE = 1024;
  private buffer = new Uint8Array(this.BUFFER_SIZE);
  private index = 0;
  private rslt;
  private mode: bleMode;
  private sentPacketSubject$ = new Subject<Uint8Array>();
  private rcvPacketSubject$ = new Subject<Uint8Array>();
  private rcvParsedSubject$ = new Subject<Object>();

  constructor(mac: string) {
    this.mac = mac;
    this.name = `${mac.substring(mac.length-4, mac.length-2)}:${mac.substring(mac.length-2, mac.length)}`;
  }

  public find(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [ 
          {services: [0x75A5]}
        ] 
      });

      this.product = this.device.name.substring(8, this.device.name.length-6);

      if (this.device) {
        console.log("[BLE] Found device");
        resolve(true);
      } else {
        console.log("find false");
        reject(false);
      }
    });
  }

  public getProduct() {
    return this.product;
  }

  public async disconnect() {
    if (this.device.gatt.connected) {
      this.device.gatt.disconnect();
      console.log("[BLE] Disconnected by user");
      await timeout_ms(1000);
    }
  }

  public isConnected() {
    return this.device.gatt.connected;
  }

  public async connect() {
    let tries = 0;
    this.service = undefined;
    this.readCharacteristic = undefined;
    this.writeCharacteristic = undefined;

    if (this.device.gatt.connected) {
      this.disconnect();
    }

    while (this.readCharacteristic === undefined || this.writeCharacteristic === undefined) {
      try {
        await this.device.gatt.connect();
        console.log('[BLE] Connected');
        this.service = await this.device.gatt.getPrimaryService(this.HAUSENN_SERVICE_UUID);
        console.log('[BLE] Got service');
        this.readCharacteristic = await this.service.getCharacteristic(
              this.HAUSENN_READ_CHARACTERISTIC);
        this.writeCharacteristic = await this.service.getCharacteristic(
              this.HAUSENN_WRITE_CHARACTERISTIC);
        console.log('[BLE] Got characteristics');
      } catch (err) {
        console.log(err); 
        tries++;
        if (tries === 5) {
          break;
        }
      }
    }

    if (this.readCharacteristic === undefined) {
      throw new Error('[BLE] Failed to estabilish connection');
    }
  }

  private listen(): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        console.log('listening');
        const notify = await this.readCharacteristic.startNotifications();

        let read = async ev => {
          let done = false;
          try {
            const target = (<BluetoothRemoteGATTCharacteristic>ev.target);
            const data = new Uint8Array(target.value.buffer);
            const rslt = await this.parsePacket(data);
            this.rslt = rslt;
            console.log(`[BLE] Result:`);
            console.log(this.rslt);
      
            if (this.mode == bleMode.SCAN) {
              if ((this.rslt.n) && (this.rslt.n == this.rslt.ap)) {
                console.log("n == ap");
                done = true;
              }
            }
            else if (this.mode == bleMode.CONN) {
              if (this.isIpValid(rslt)) {
                console.log("n == true")
                this.rslt = rslt;
                done = true;
              }
            }
            else if (this.mode == bleMode.FIND_ME) {
              console.log('AAAAAAAAAAAAAAAAAAAAAAAAAa');
              done = true;
            }
            if (done) {
              console.log('AAAAAAAAAAAAAAAAAAAAAAAAAa');
              await this.readCharacteristic.stopNotifications();
              notify.removeEventListener('characteristicvaluechanged', read);
              resolve(true);
            }
          } catch (err) {
            console.log(err);
            resolve(false);
          }
        };

        notify.addEventListener('characteristicvaluechanged', read);
      } catch (err) {
        throw err;
      }
    });
  }

  private async parsePacket(data: Uint8Array): Promise<string> {
    return new Promise(async resolve => {
      this.buffer.set(data, this.index);
      this.index += data.length;

      if (this.buffer[0] !== 0x75 || this.buffer[1] !== 0xa5) {
        this.index = 0;
        console.warn('Dropped packet: [' + data.toString() + ']');
      }

      // End of packet, assemble  and report.
      if (
        this.buffer[this.index - 2] === 0xa5 &&
        this.buffer[this.index - 1] === 0xd5
      ) {
        const buf = this.buffer.subarray(0, this.index);
        this.index = 0;
        this.buffer = new Uint8Array(this.BUFFER_SIZE);

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

  private async write(buffer: ArrayBuffer, length: number): Promise<boolean> {
    return new Promise(async resolve => {
      let wrote = false;

      try {
        // if (this.isConnected() === false) {
        //   this.connect();
        // }

        for (let i = 0; i < length/16; i++) {
          await this.writeCharacteristic.writeValue(buffer.slice(i*16, (i+1)*16));
        }
        console.log('wrote');

        wrote = true;

      } catch (err) {
        console.log(err);
      } finally {
        resolve(wrote);
      }
    });
  }

  public async scanWifi(ap: number) {
    var wrote = false;

    try {
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

      // while (wrote === false) {
        wrote = await this.write(packet, packet.byteLength);
      // }

      const prom = await this.listen();

      Promise.all([prom]);
    } catch (err) {
      throw err;
    }
  }

  public async connectToWifi(ssid: string, pswd: string, bssid: string) {
    var wrote = false;

    try {
      this.setMode(bleMode.CONN);

      const request = new Packet(bleMode.CONN);

      console.log(request);

      const data = {
        "ap": null,
        "ssid": ssid,
        "pswd": pswd,
        "bssid": bssid, 
      };

      await request.setData(data);

      const packet = request.getPackage().buffer;

      this.sentPacketSubject$.next(new Uint8Array(packet));

      // while (wrote === false) {
        wrote = await this.write(packet, packet.byteLength);
      // }

      const prom = await this.listen();

      Promise.all([prom]);
    } catch (err) {
      throw err;
    }
  }

  public async findMe() {
    var wrote = false;

    try {
      this.setMode(bleMode.FIND_ME);

      const request = new Packet(bleMode.FIND_ME);

      console.log(request);

      await request.setData();

      const packet = request.getPackage().buffer;

      this.sentPacketSubject$.next(new Uint8Array(packet));

      // while (wrote === false) {
        wrote = await this.write(packet, packet.byteLength);
      // }

      const prom = await this.listen();

      Promise.all([prom]);
    } catch (err) {
      throw err;
    }
  }

  public async custom(data) {
    var wrote = false;

    try {
      this.setMode(bleMode.CUSTOM);

      const request = new Packet(bleMode.CUSTOM);

      console.log(request);

      await request.setData(data);

      const packet = request.getPackage().buffer;

      this.sentPacketSubject$.next(new Uint8Array(packet));

      // while (wrote === false) {
        wrote = await this.write(packet, packet.byteLength);
      // }

      const prom = await this.listen();

      Promise.all([prom]);
    } catch (err) {
      throw err;
    }
  }

  public getIp() {
    return this.rslt;
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