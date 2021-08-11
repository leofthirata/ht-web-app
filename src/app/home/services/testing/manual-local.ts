import { DeviceState, WebSocketService } from "../websocket/ws";

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
    this.m_request.command = {"cm": 3};

    // const onOpen = await this.socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    // const socket = await this.socket.send(this.m_request, this.devicePubKeyPem);
    // const resp = await this.socket.receive(socket);
    // const success = JSON.parse(resp).mg;
    // if (success == 'fail') {
    //   throw 'GET_INFO FAIL';
    // }

    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }
  
  public async ERASE_IR() {
    this.m_request.command = {"cm": 0, "id": 1};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }
  
  public async GET_IR() {
    this.m_request.command = {"cm": 1};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async SET_IR() {
    this.m_request.command = {"cm": 2, "id": 1, "ch": 3};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async CANCEL_IR() {
    this.m_request.command = {"cm": 4};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async EDIT_IR() {
    this.m_request.command = {"cm": 5, "id": 1};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async RUN_SCENE() {
    this.m_request.command = {"cm": 6, "sc":[{"dy":1,"id": 1,"ch":3}]};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async FAC_RESET() {
    this.m_request.command = {"cm": 11};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async GET_HEAP() {
    this.m_request.command = {"cm": 13};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async RESET() {
    this.m_request.command = {"cm": 14};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async BLE_ON() {
    this.m_request.command = {"cm": 15};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async BLE_OFF() {
    this.m_request.command = {"cm": 16};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }

  public async FIND_ME() {
    this.m_request.command = {"cm": 17};
    const resp = await this.socket.localRequest(`ws://${this.uri}/ws`, this.m_request, this.myPrivKey, this.devicePubKeyPem);
  }
}