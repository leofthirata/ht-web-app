import { WebSocketService } from "../../websocket/ws";

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
  
      // this.check(jResp.sender !== devReq.recipient, 'Invalid "sender": ' + jResp.sender);
      // this.check(jResp.recipient !== devReq.sender, 'Invalid "recipient": ' + jResp.recipient);
      // this.check(jResp.messageId !== devReq.messageId, 'Invalid "messageId": ' + jResp.messageId);
  
      // jResp = jResp.payload.command;
  
      // this.check(jResp.ui !== devReq.recipient, 'Invalid "ui": ' + jResp.ui);
  
      // devReq = devReq.payload.command;
  
      // this.check(jResp.cm !== devReq.cm, 'Invalid "cm": ' + jResp.cm);
      // this.check(jResp.ty !== 'one', 'Invalid "ty": ' + jResp.ty);
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }
  
  public async ERASE_IR(id: number) {
    this.request.payload.command = {"cm": 0, "id": id};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }
  
  public async GET_IR() {
    this.request.payload.command = {"cm": 1};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  public async SET_IR(id: number, ch: number) {
    this.request.payload.command = {"cm": 2, "id": id, "ch": ch};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  public async CANCEL_IR() {
    this.request.payload.command = {"cm": 4};
    let devReq = this.request;
    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  public async EDIT_IR(id: number) {
    this.request.payload.command = {"cm": 5, "id": id};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  public async RUN_SCENE() {
    this.request.payload.command = {"cm":6,"sc":[{"dy":1,"id": 1,"ch":3}]};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  public async FAC_RESET() {
    this.request.payload.command = {"cm": 11};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  public async GET_HEAP() {
    this.request.payload.command = {"cm": 13};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  public async RESET() {
    this.request.payload.command = {"cm": 14};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  public async BLE_ON() {
    this.request.payload.command = {"cm": 15};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  public async BLE_OFF() {
    this.request.payload.command = {"cm": 16};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  public async FIND_ME() {
    this.request.payload.command = {"cm": 17};
    let devReq = this.request;

    try {
      const resp = await this.socket.remoteRequest(this.uri, this.request);
      let jResp = JSON.parse(resp).mg;
    } catch (err) {
      // this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  public async CUSTOM(request) {
    try {
      await this.socket.remoteRequest(this.uri, request);
    } catch (err) {

    }
  }

  private check(test, mg: string) {
    if (test)
      throw mg;
  }
}