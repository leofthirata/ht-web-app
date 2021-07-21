export class BluetoothService {
  constructor(mac: string) {
    this.m_mac = mac;
    this.m_name = `${mac.substring(mac.length-4, mac.length-2)}:${mac.substring(mac.length-2, mac.length)}`;
  }
  private m_mac: string;
  private m_name: string;
  private m_ble: Bluetooth;
  private m_device: BluetoothDevice;
  // private m_device: BluetoothDevice[];
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
      // this.m_readCharacteristic.startNotifications();
      let val = await this.m_readCharacteristic.readValue();
      console.log(val);
      resolve(true);
    });
  }

  public scanWifi(): Promise<boolean> {
    return new Promise(async resolve => {
      console.log("before scanwifiiiiiiii")
      const data = '75a51081a4f1c66d2f9195c85d6e02534b0333ab4bbc813cd2edf794a6c3582d1b9451a5d5';
      
      //converter data para hexa e depois colocar no arraybuffer

      let buffer = new ArrayBuffer(data.length/32);
      // let buffer = [];
      for(let i = 0; (i*32) < data.length; 32*(i++)) {
        buffer[i] = data.substring(i*32, (i+1)*32);
      }
      console.log(buffer);

      await this.m_writeCharacteristic.writeValue(buffer);
      console.log("after scanwifiiiiiiii")
      resolve(true);
    });
  }

  // public write()
}