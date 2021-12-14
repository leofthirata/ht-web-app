import { WebSocketService } from "../../websocket/ws";
import { GET_INFO_REQ, GET_ALL_REQ, GET_STATUS_REQ, SET_STATUS_REQ, RUN_SCENE_REQ, FAC_RESET_REQ, GET_HEAP_REQ, RESET_REQ, BLE_ON_REQ, BLE_OFF_REQ, FIND_ME_REQ } from './requests'

export class LuminaLocalTestingService {
  private m_request: any;
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

    this.m_request = { "token": this.deviceToken, "key": this.myPubKeyPem };
  }

  // TESTS
  public async GET_INFO() {
    this.m_request.command = GET_INFO_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async GET_ALL() {
    this.m_request.command = GET_ALL_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async GET_STATUS(ch: number) {
    this.m_request.command = GET_STATUS_REQ;
    this.m_request.command.ch = ch;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }
  
  public async SET_STATUS_ON(ch: number) {
    this.m_request.command = SET_STATUS_REQ;
    this.m_request.command.ch = ch;
    this.m_request.command.st = "on";
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async SET_STATUS_OFF(ch: number) {
    this.m_request.command = SET_STATUS_REQ;
    this.m_request.command.ch = ch;
    this.m_request.command.st = "off";
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async RUN_SCENE() {
    this.m_request.command = RUN_SCENE_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async FAC_RESET() {
    this.m_request.command = FAC_RESET_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async GET_HEAP() {
    this.m_request.command = GET_HEAP_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async RESET() {
    this.m_request.command = RESET_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async BLE_ON() {
    this.m_request.command = BLE_ON_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async BLE_OFF() {
    this.m_request.command = BLE_OFF_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async FIND_ME() {
    this.m_request.command = FIND_ME_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async CUSTOM(request) {
    this.m_request.command = request;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }
}