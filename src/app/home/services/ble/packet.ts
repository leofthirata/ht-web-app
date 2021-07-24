import { encrypt, decrypt } from "../../utils/encrypt";
import { crc8 } from "../../utils/crc8";
import { arr2str, concatBuffers, str2ArrayBuffer, str2arr, ascii2hex } from "../../utils/utils";
import { bleMode } from "./ble";
import { PacketResponse } from "./response";

export class Packet {
  private readonly m_header = new Uint8Array([0x75, 0xa5]);
  private m_IV: Uint8Array = null;
  private m_enc: Uint8Array = null;
  private readonly m_tail = new Uint8Array([0xa5, 0xd5]);
  private m_value: Uint8Array = null;
  private m_data: Uint8Array = null;
  private readonly m_key = new Uint8Array([0x02, 0xE5, 0x96, 0xCD, 0xAB, 0x2D, 0x81, 0x32, 0x0A, 0x94, 0xBF, 0xD6, 0xD5, 0x2B, 0xAF, 0xAE]);
  private m_crc: Uint8Array = null;
  private m_mode: bleMode;
  private m_cmd: Uint8Array = null;
  private m_resp: Uint8Array = null;

  constructor(mode?: bleMode) {
    this.m_mode = mode;
  }

  private _createWifiScanCmd(ap: number) {
    this.m_cmd = new Uint8Array([0x01, ap]);
  }

  private _createWifiConnCmd(ssid: string, pswd: string) {
    let cmd = str2arr('02' + ascii2hex(ssid) + '00' + ascii2hex(pswd) + '00');

    for(let i = 0; i < 12; i++) {
      cmd[cmd.length] = 0x00;
    }

    this.m_cmd = cmd;
  }

  private _createFindMeCmd() {
    this.m_cmd = new Uint8Array([0x03, 0x00]);
  }

  private async _build(): Promise<void> {
    const totalLength = 21 + this.m_enc.byteLength;

    const rslt = new Uint8Array(totalLength);
    
    let index = 0;
    rslt[index] = this.m_header[0];
    index++;
    rslt[index] = this.m_header[1];
    index++;
    rslt[index] = this.m_enc.byteLength;
    index++;
    rslt.set(this.m_data, index);
    index += this.m_data.byteLength;
    rslt[index] = this.m_tail[0];
    index++;
    rslt[index] = this.m_tail[1];

    this.m_value = rslt;
  } 

  public async setData(data?): Promise<void> {
    switch (this.m_mode) {
      case bleMode.SCAN: {
        this._createWifiScanCmd(data.ap);
        break;
      }
      case bleMode.CONN: {
        this._createWifiConnCmd(data.ssid, data.pswd);
        break;
      }
      case bleMode.FIND_ME: {
        this._createFindMeCmd();
        break;
      }
      default: {
        break;
      }
    }

    this.m_crc = await crc8(this.m_cmd);
    var cmd_crc = new Uint8Array(this.m_cmd.byteLength + this.m_crc.byteLength);
    cmd_crc.set(this.m_cmd);
    cmd_crc.set(this.m_crc, this.m_cmd.byteLength);
    let pack = await encrypt(cmd_crc, this.m_key);
    this.m_IV = pack.iv;
    this.m_enc = new Uint8Array(pack.enc);
    this.m_data = pack.package;

    await this._build();
  }

  public decode(data: Uint8Array): Promise<any> {
    return new Promise(async resolve => {
      // private m_crc: Uint8Array = null;
      // private m_mode: bleMode;
      // private m_cmd: Uint8Array = null;

      this.m_IV = data.subarray(3, 3 + this.m_key.length);
      this.m_enc = data.subarray(3 + this.m_IV.length, data.length - 2);
      this.m_data = data.subarray(3, data.length - 2);
      this.m_value = data;
      const decrypted = await decrypt(this.m_enc, this.m_IV, this.m_key);
      this.m_crc = decrypted.subarray(decrypted.length - 1, decrypted.length);
      this.m_cmd = decrypted.subarray(0, 1);
      this.m_resp = decrypted.subarray(1, decrypted.length - 1);

      const packetResponse = new PacketResponse(decrypted.subarray(0, decrypted.length - 1));
      const response = packetResponse.parse();
      resolve(response);
    });
  }

  public getPackage(): Uint8Array {
    return this.m_value;
  }
}