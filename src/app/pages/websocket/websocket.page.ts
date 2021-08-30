import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-websocket',
  templateUrl: './websocket.page.html',
  styleUrls: ['./websocket.page.scss'],
})

export class WebsocketPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  // public encryptOnClick() {

  //   this.m_ws.send(this._encryptWebsocketJSON(JSON.stringify(request)));
  // }

  // public decryptOnClick() {
  //   const decrypted = this.decryptWebsocketJSON(new Uint8Array(data));
  // }

  // private _encryptWebsocketJSON(data: string): Uint8Array {
  //   const blocks = Math.ceil(data.length / 117);
  //   const buffer = new Uint8Array(blocks * 128);

  //   for (let i = 0; i < blocks; i++) {
  //     const end = Math.min((i + 1) * 117, data.length);
  //     const slice = data.substring(i * 117, end);
  //     const payload = encryptRSA(slice, this.m_devicePublicKey);
  //     const bytes = this.stringToBytes(payload);
  //     buffer.set(bytes, i * 128);
  //   }

  //   return buffer;
  // }

  // private decryptWebsocketJSON(payload: Uint8Array) {
  //   const blocks = Math.ceil(payload.length / 128);

  //   let buffer = '';

  //   for (let i = 0; i < blocks; i++) {
  //     const slice = payload.slice(i*128, (i+1)*128);
  //     const str = this.bytesToString(slice);
  //     const data = decryptRSA(str, this.m_privKey);//.decrypt(str);
  //     buffer = buffer + data;
  //   }

  //   return buffer;
  // }

  // private stringToBytes(val: string): Uint8Array {
  //   const buffer = new Uint8Array(val.length);

  //   for (let i = 0; i < val.length; i++) {
  //     buffer[i] = val.charCodeAt(i);
  //   }

  //   return buffer;
  // }

  // private bytesToString(val: Uint8Array): string {
  //   const buffer: string[] = [];

  //   for (const byte of val) {
  //     buffer.push(String.fromCharCode(byte));
  //   }

  //   return buffer.join('');
  // }

  // private buf2hex(buffer: any): any {
  //   // buffer is an ArrayBuffer
  //   return [...new Uint8Array(buffer)]
  //     .map(x => x.toString(16).padStart(2, '0'))
  //     .join('');
  // }
}