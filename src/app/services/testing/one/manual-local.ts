import { DeviceState, WebSocketService } from "../../websocket/ws";
import { GET_INFO_REQ, GET_IR_REQ, CANCEL_IR_REQ, SET_IR_REQ, EDIT_IR_REQ, ERASE_IR_REQ, ERASE_ALL_IR_REQ, RUN_SCENE_REQ, FAC_RESET_REQ, SAVE_IR_REQ, VIEW_IR_REQ, GET_HEAP_REQ, RESET_REQ, BLE_ON_REQ, BLE_OFF_REQ, FIND_ME_REQ } from '../requests'

export class OneLocalTestingService {
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

    // const onOpen = await this.socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    // const socket = await this.socket.send(this.m_request, this.devicePubKeyPem);
    // const resp = await this.socket.receive(socket);
    // const success = JSON.parse(resp).mg;
    // if (success == 'fail') {
    //   throw 'GET_INFO FAIL';
    // }

    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }
  
  public async ERASE_IR(id: number) {
    this.m_request.command = {"cm": 0, "id": id};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }
  
  public async GET_IR() {
    this.m_request.command = GET_IR_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async SET_IR(id: number, ch: number) {
    this.m_request.command = {"cm": 2, "id": id, "ch": ch};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async CANCEL_IR() {
    this.m_request.command = CANCEL_IR_REQ;
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async EDIT_IR(id: number) {
    this.m_request.command = {"cm": 5, "id": id};
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