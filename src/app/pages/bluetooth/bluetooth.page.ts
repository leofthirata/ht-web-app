import { Component, OnInit } from '@angular/core';

import { encrypt, decrypt } from "../../utils/encrypt";
import { crc8 } from "../../utils/crc8";
import { Cast } from '../../utils/cast';
import { uint8ArrayToHexString } from "../../utils/utils";
import { auth } from "../../services/ble/wifi-auth-modes.enum";
import { ciph } from "../../services/ble/wifi-cipher-types.enum";

export enum bleMode {
  SCAN = 'scan',
  CONN = 'conn',
  FIND_ME = 'find_me',
}

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
  public pData = '';
  public pResp = '';

  public apTotal : number;
  public apFound : number;
  public apNum : number;
  public rssi : number;
  public auth = '';
  public ciph = '';
  public ssid = '';
  public pswd = '';
  public bssid = '';

  public ip = '';
  public staMac = '';
  public reg = '';

  public isScanWifi = false;
  public isConnectWifi = false;
  public isFindMe = false;
  public isDone = false;

  public isRcvd = false;
  public isSent = false;

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

    this.pDec = Cast.bytesToHex(decrypted);
    this.pCmd = Cast.bytesToHex(this.cmd);
    this.pCrc = Cast.bytesToHex(this.crc);
    this.pData = Cast.bytesToHex(this.resp);
    this.pEnc = Cast.bytesToHex(this.enc);
    this.pIV = Cast.bytesToHex(this.IV);
    this.pLength = Cast.bytesToHex(data.subarray(2, 3));
    this.pResult = this.package;

    switch(this.cmd[0]) {
      case 0x00: 
      case 0x03: {
        this.isConnectWifi = false;
        this.isScanWifi = false;
        this.isFindMe = false;
        this.isDone = true;

        this.pResp = 'DONE';
        break;
      }
      case 0x01: {
        this.isConnectWifi = false;
        this.isScanWifi = true;
        this.isFindMe = false;
        this.isDone = false;
        
        let count = 0;
        let newResp = this.resp;

        for (let i = 0; i < newResp.byteLength; i++) {
          count = newResp[i] == 0x00 ? count + 1 : count;
        }

        if (count > 0) {
          this.isRcvd = true;
          this.isSent = false;

          this.apFound = this.resp[1];
          this.apNum = this.resp[2];
          this.ssid = Cast.bytesToString(new Uint8Array(this.resp.subarray(3, this.resp.length - 10)));
          this.rssi = this.resp.subarray(this.resp.length - 9, this.resp.length - 8)[0] - 256;
          const authIndex = this.resp.subarray(this.resp.length - 8, this.resp.length - 7)[0];
          this.auth = auth[authIndex];
          const ciphIndex = this.resp.subarray(this.resp.length - 7, this.resp.length - 6)[0];
          this.ciph = ciph[ciphIndex];
          this.bssid = Cast.bytesToHex(this.resp.subarray(this.resp.length - 6, this.resp.length));
        } else {
          this.isRcvd = false;
          this.isSent = true;
          
          this.apTotal = newResp[0];
        }
        break;
      }
      case 0x02: {
        this.isConnectWifi = true;
        this.isScanWifi = false;
        this.isFindMe = false;
        this.isDone = false;

        let newResp = this.resp;
        let index = 0;
        let state = 0;
        let count = 0;

        for (let i = 0; i < newResp.byteLength; i++) {
          count = newResp[i] == 0x00 ? count + 1 : count;
        }

        if (count == 3) {
          this.isRcvd = false;
          this.isSent = true;
          while (index !== -1 && index !== newResp.byteLength && state !== 3) {
            index = newResp.findIndex(el => el === 0x00);

            if (state == 0) {
              this.ssid = Cast.bytesToString(newResp.subarray(0, index));
              state++;
            } else if (state == 1) {
              this.pswd = Cast.bytesToString(newResp.subarray(0, index));
              state++;
            } else {
              this.bssid = Cast.bytesToHex(new Uint8Array(newResp.subarray(0, index)));
              state++;
            }

            newResp = newResp.subarray(index + 1, newResp.byteLength);
          }
        } else {
          this.isRcvd = true;
          this.isSent = false;
          this.ip = this._hex2ip(uint8ArrayToHexString(newResp.subarray(3, 7)));
          this.staMac = uint8ArrayToHexString(newResp.subarray(7, 13));
          this.reg = newResp[2] === 0x01 ? 'registered' : 'not registered';
        }
        break;
      }
      default: {
        break;
      }
    }
  }

  private _hex2ip(hex) {
    var ip = '';
  
    for(let i = 0; i < hex.length/2; i++) {
      ip += parseInt((hex).substring(i*2, (i+1)*2), 16) + '.';
    }
  
    return ip.substring(0, ip.length-1);
  }

  public clearOnClick() {
    this.length = 0;
  
    this.package = '';
    this.send = '';
  
    this.pHeader = '75A5';
    this.pIV = '';
    this.pEnc = '';
    this.pTail = 'A5D5';
    this.pKey = '02E596CDAB2D81320A94BFD6D52BAFAE';
    this.pCrc = '';
    this.pCmd = '';
    this.pLength = '';
    this.pDec = '';
    this.pResult = '';
    this.pData = '';
    this.pResp = '';
  
    this.auth = '';
    this.ciph = '';
    this.ssid = '';
    this.pswd = '';
    this.bssid = '';
  
    this.ip = '';
    this.staMac = '';
    this.reg = '';
  
    this.isScanWifi = false;
    this.isConnectWifi = false;
    this.isFindMe = false;
    this.isDone = false;
  
    this.isRcvd = false;
    this.isSent = false;
  }
}
