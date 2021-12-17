import { WebSocketService } from "../../websocket/ws";
import { GET_INFO_REQ, GET_ALL_REQ, GET_STATUS_REQ, SET_STATUS_REQ, RUN_SCENE_REQ, FAC_RESET_REQ, GET_HEAP_REQ, RESET_REQ, BLE_ON_REQ, BLE_OFF_REQ, FIND_ME_REQ } from './requests'

export class LuminaLocalTestingService {
  private request: any;
  private myPubKeyPem: any;
  private myPrivKey: any;
  private devicePubKeyPem: any;
  private deviceToken: any;
  private uri: string;
  private socket: WebSocketService;

  constructor(uri:string, myPubKeyPem, myPrivKey, devicePubKeyPem, deviceToken, socket: WebSocketService) {
    this.myPubKeyPem = myPubKeyPem;
    this.myPrivKey = myPrivKey;
    this.devicePubKeyPem = devicePubKeyPem;
    this.deviceToken = deviceToken;
    this.uri = uri;
    this.socket = socket;

    this.request = { "token": this.deviceToken, "key": this.myPubKeyPem };
  }

  private check(test, mg: string) {
    if (test)
      throw mg;
  }

  // TESTS
  public async GET_INFO() {
    this.request.command = GET_INFO_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async GET_ALL() {
    this.request.command = GET_ALL_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async GET_STATUS(ch: number) {
    try {
      this.request.command = GET_STATUS_REQ;
      this.request.command.ch = ch;
      const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);

      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.request.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.ch !== this.request.command.ch, 'Invalid "ch": ' + pResp.ch);
    } catch (err) {
      console.log(err);
    }
  }
  
  public async SET_STATUS_ON(ch: number) {
    try {  
      this.request.command = SET_STATUS_REQ;
      this.request.command.ch = ch;
      this.request.command.st = "on";
      const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);

      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.request.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.ch !== this.request.command.ch, 'Invalid "ch": ' + pResp.ch);
      this.check(pResp.st !== 'ok', 'Invalid "st": ' + pResp.st);
    } catch (err) {
      console.log(err);
    }
  }

  public async SET_STATUS_OFF(ch: number) {
    try {
      this.request.command = SET_STATUS_REQ;
      this.request.command.ch = ch;
      this.request.command.st = "off";
      const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);

      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.request.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.ch !== this.request.command.ch, 'Invalid "ch": ' + pResp.ch);
      this.check(pResp.st !== 'ok', 'Invalid "st": ' + pResp.st);
    } catch (err) {
      console.log(err);
    }
  }

  public async RUN_SCENE() {
    this.request.command = RUN_SCENE_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async FAC_RESET() {
    this.request.command = FAC_RESET_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async GET_HEAP() {
    this.request.command = GET_HEAP_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async RESET() {
    this.request.command = RESET_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async BLE_ON() {
    this.request.command = BLE_ON_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async BLE_OFF() {
    this.request.command = BLE_OFF_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async FIND_ME() {
    this.request.command = FIND_ME_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async CUSTOM(request) {
    this.request.command = request;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.request, this.myPrivKey, this.devicePubKeyPem);
  }
}