import { Component, OnInit } from '@angular/core';

import { encrypt, decrypt } from "../../home/utils/encrypt";
import { crc8 } from "../../home//utils/crc8";
import { Cast } from '../../home/utils/cast';

@Component({
  selector: 'app-bluetooth',
  templateUrl: './bluetooth.page.html',
  styleUrls: ['./bluetooth.page.scss'],
})
export class BluetoothPage implements OnInit {

  public header = new Uint8Array([0x75, 0xA5]);
  public IV: Uint8Array = null;
  public enc: Uint8Array = null;
  public tail = new Uint8Array([0xA5, 0xD5]);
  public value: Uint8Array = null;
  public data: Uint8Array = null;
  public key = new Uint8Array([0x02, 0xE5, 0x96, 0xCD, 0xAB, 0x2D, 0x81, 0x32, 0x0A, 0x94, 0xBF, 0xD6, 0xD5, 0x2B, 0xAF, 0xAE]);
  public crc: Uint8Array = null;
  public cmd: Uint8Array = null;
  public resp: Uint8Array = null;
  public length = 0;
  public dec: Uint8Array = null;

  public package = '';
  public send = '';

  public pHeader = '75A5';
  public pIV = '';
  public pEnc = '';
  public pTail = 'A5D5';
  public pKey = '02E596CDAB2D81320A94BFD6D52BAFAE';
  public pCrc = '';
  public pCmd = '';
  public pLength = '';
  public pDec = '';
  public pResult = '';

  public isReadOnly = true;
  
  constructor() { }

  ngOnInit() {
  }

  private build() {
    this.length = this.enc.byteLength;
    this.pLength = Cast.bytesToHex(new Uint8Array([this.length]));

    const totalLength = 21 + this.length;

    const rslt = new Uint8Array(totalLength);
    
    let index = 0;
    rslt[index] = this.header[0];
    index++;
    rslt[index] = this.header[1];
    index++;
    rslt[index] = this.length;
    index++;
    rslt.set(this.data, index);
    index += this.data.byteLength;
    rslt[index] = this.tail[0];
    index++;
    rslt[index] = this.tail[1];

    this.value = rslt;
    this.pResult = Cast.bytesToHex(rslt);
    console.log(this.value);
  } 

  public async buildPackageOnClick() {
    if (this.package.substring(0, 2) == '0x') {
      this.cmd = Cast.hexToBytes(this.package.substring(2, this.package.length));
    } else {
      this.cmd = Cast.hexToBytes(this.package);
    }

    this.crc = await crc8(this.cmd);
    var cmd_crc = new Uint8Array(this.cmd.byteLength + this.crc.byteLength);
    cmd_crc.set(this.cmd);
    cmd_crc.set(this.crc, this.cmd.byteLength);
    console.log(cmd_crc);
    let pack = await encrypt(cmd_crc, this.key);
    this.IV = pack.iv;
    this.enc = new Uint8Array(pack.enc);
    this.data = pack.package;

    this.pDec = Cast.bytesToHex(this.cmd);
    this.pCrc = Cast.bytesToHex(this.crc);
    this.pEnc = Cast.bytesToHex(this.enc);
    this.pIV = Cast.bytesToHex(this.IV);

    this.build();
  }

  public async decodePackageOnClick() {
    console.log(this.package.substring(0, 2));
    if (this.package.substring(0, 2) == '0x') {
      var data = Cast.hexToBytes(this.package.substring(2, this.package.length));
    } else {
      var data = Cast.hexToBytes(this.package);
    }

    this.IV = data.subarray(3, 3 + this.key.length);
    this.enc = data.subarray(3 + this.IV.length, data.length - 2);
    this.data = data.subarray(3, data.length - 2);
    this.value = data;
    const decrypted = await decrypt(this.enc, this.IV, this.key);
    this.crc = decrypted.subarray(decrypted.length - 1, decrypted.length);
    this.cmd = decrypted.subarray(0, 1);
    this.resp = decrypted.subarray(1, decrypted.length - 1);

    this.pDec = Cast.bytesToHex(this.cmd);
    this.pCrc = Cast.bytesToHex(this.crc);
    this.pEnc = Cast.bytesToHex(this.enc);
    this.pIV = Cast.bytesToHex(this.IV);
    this.pLength = Cast.bytesToHex(data.subarray(2, 3));
    this.pResult = this.package;
  }

}
