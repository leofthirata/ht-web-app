import { WebSocketService } from "../websocket/ws";

export class OneRemoteTestingService {
  private request: any;
  private uri: string;
  private socket: WebSocketService;
  private readonly backend = 'wss://cloud1.hausenn.com.br/websocket-service/v1';
  private userTicket: string;

  constructor(userTicket: string, request: any, socket: WebSocketService) {
    this.userTicket = userTicket;
    this.uri = `${this.backend}/${this.userTicket}hauidup`;
    this.request = request;
    this.socket = socket;
  }

  // TESTS
  public async GET_INFO() {
    this.request.payload.command = {"cm": 3};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
  
      this.check(jResp.sender !== devReq.recipient, 'Invalid "sender": ' + jResp.sender);
      this.check(jResp.recipient !== devReq.sender, 'Invalid "recipient": ' + jResp.recipient);
      this.check(jResp.messageId !== devReq.messageId, 'Invalid "messageId": ' + jResp.messageId);
  
      jResp = jResp.payload.command;
  
      this.check(jResp.ui !== devReq.recipient, 'Invalid "ui": ' + jResp.ui);
  
      devReq = devReq.payload.command;
  
      this.check(jResp.cm !== devReq.cm, 'Invalid "cm": ' + jResp.cm);
      this.check(jResp.ty !== 'one', 'Invalid "ty": ' + jResp.ty);
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }
  
  public async ERASE_IR() {
  }
  
  public async GET_IR() {
  }

  public async SET_IR() {
  }

  public async CANCEL_IR() {
  }

  public async EDIT_IR() {
  }

  public async RUN_SCENE() {
  }

  public async FAC_RESET() {
  }

  public async GET_HEAP() {
  }

  public async RESET() {
  }

  public async BLE_ON() {
  }

  public async BLE_OFF() {
  }

  public async FIND_ME() {
  }

  private check(test, mg: string) {
    if (test)
      throw mg;
  }
}