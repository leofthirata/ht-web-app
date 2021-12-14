import { DeviceService } from "../../device/device";
import { getLength, getFrequency, getFirstBurst, getSecondBurst, removePreamble, parse2hex, checkBurst, checkFrequency} from "../ir-utils";
import { code } from '../ir-codes';
import { Observable, Subject } from 'rxjs';
import { timeout_ms } from "../../../utils/utils";
import { Cast } from '../../../utils/cast';
import * as Colors from '../../../utils/color';
import { GET_INFO_REQ, GET_IR_REQ, CANCEL_IR_REQ, SET_IR_REQ, EDIT_IR_REQ, ERASE_IR_REQ, ERASE_ALL_IR_REQ, RUN_SCENE_REQ, FAC_RESET_REQ, SAVE_IR_REQ, VIEW_IR_REQ, GET_HEAP_REQ, RESET_REQ, BLE_ON_REQ, BLE_OFF_REQ, FIND_ME_REQ } from './requests'

export class oneRemote {
  // source
  private sDev: DeviceService;
  private sRequest: any;
  private sDevPubKeyPem: any;
  private sToken: any;
  private sUri: string;
  private sMyPubKeyPem: any;
  private sMyPrivKey: any;
  private sTerm;
  private sLogger;
  private sSocket;

  // target
  private tDev: DeviceService;
  private tRequest: any;
  private tDevPubKeyPem: any;
  private tToken: any;
  private tUri: string;
  private tMyPubKeyPem: any;
  private tMyPrivKey: any;
  private tTerm;
  private tLogger;
  private tSocket;

  private stopTesting = false;

  private sError$ = new Subject<string>();
  private tError$ = new Subject<string>();

  private request: any;
  private uri: string;
  private readonly backend = 'wss://cloud1.hausenn.com.br/websocket-service/v1';
  private userTicket: string;

  // constructor(userTicket: string, request: any, socket: WebSocketService) {
  //   this.userTicket = userTicket;
  //   this.uri = `${this.backend}/${this.userTicket}hauidup`;
  //   this.request = request;
  //   this.socket = socket;
  // }

  constructor(source: DeviceService, sTerminal, target: DeviceService, tTerminal) {
    this.sTerm = sTerminal;
    this.tTerm = tTerminal;

    this.sDev = source;
    this.tDev = target;

    this.sMyPubKeyPem = source.getMyPubKeyPem();
    this.sMyPrivKey = source.getMyPrivKey();
    this.sDevPubKeyPem = source.getDevPubKeyPem();
    this.sToken = source.getToken();
    this.sUri = source.getIp();
    this.sSocket = source.getSocket();
    this.sLogger = source.getLogger();

    this.tMyPubKeyPem = target.getMyPubKeyPem();
    this.tMyPrivKey = target.getMyPrivKey();
    this.tDevPubKeyPem = target.getDevPubKeyPem();
    this.tToken = target.getToken();
    this.tUri = target.getIp();
    this.tSocket = target.getSocket();
    this.tLogger = target.getLogger();

    this.userTicket = source.getUserTicket();

    this.sRequest = {
      "payload": { 
        "macToken": this.sToken,
      }, 
      "sender": this.sDev.getUserUuid(),
      "recipient": this.sDev.getDevUuid() 
    };

    this.tRequest = {
      "payload": { 
        "macToken": this.tToken,
      }, 
      "sender": this.tDev.getUserUuid(),
      "recipient": this.tDev.getDevUuid() 
    };

    this.uri = `${this.backend}/${this.userTicket}hauidup`;
  }

  public async start() {
    await this.getInfo();
    await this.getIr();
    await this.setIr();
    await this.cancelIr();
    // await this.editIr();
    await this.runScene();
  }

  public async sEraseIr() {
    try {
      this.sRequest.command = {"cm": 0, "id": 1};
      const resp = await this.sSocket.remoteRequest(this.uri, this.sRequest);
      let res = JSON.parse(resp);

      this.check(res.sender !== this.sRequest.recipient, 'Invalid "sender": ' + res.sender);
      this.check(res.recipient !== this.sRequest.sender, 'Invalid "recipient": ' + res.recipient);
      this.check(res.messageId !== this.sRequest.messageId, 'Invalid "messageId": ' + res.messageId);
  
      res = res.payload.command;

      this.check(res.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + res.cm);
      this.check(res.id !== this.sRequest.command.id, 'Invalid "id": ' + res.id);
      this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
    } catch (err) {
      this.slogErrorAndAbort('eraseIr', 'ERASE_IR', err);
    }
  }

  public async tEraseIr() {
    try {
      this.tRequest.command = {"cm": 0, "id": 1};
      const resp = await this.tSocket.remoteRequest(this.uri, this.tRequest);
      let res = JSON.parse(resp);

      this.check(res.sender !== this.tRequest.recipient, 'Invalid "sender": ' + res.sender);
      this.check(res.recipient !== this.tRequest.sender, 'Invalid "recipient": ' + res.recipient);
      this.check(res.messageId !== this.tRequest.messageId, 'Invalid "messageId": ' + res.messageId);
  
      res = res.payload.command;

      this.check(res.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + res.cm);
      this.check(res.id !== this.tRequest.command.id, 'Invalid "id": ' + res.id);
      this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
    } catch (err) {
      this.tlogErrorAndAbort('eraseIr', 'ERASE_IR', err);
    }
  }

  public async eraseIr() {
    await this.prepare();
    this.sEraseIr();
    if (this.tDev.isTicketSet()) {
      this.tEraseIr();
    }
  }

  public async getIr() {
    await this.prepare();

    try {
      this.tRequest.command = {"cm": 1};
      this.tSocket.remoteRequest(this.uri, this.tRequest).then(resp => {
        try {
          let res = JSON.parse(resp);

          this.check(res.sender !== this.tRequest.recipient, 'Invalid "sender": ' + res.sender);
          this.check(res.recipient !== this.tRequest.sender, 'Invalid "recipient": ' + res.recipient);
          this.check(res.messageId !== this.tRequest.messageId, 'Invalid "messageId": ' + res.messageId);
      
          res = res.payload.command;
    
          this.check(res.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + res.cm);
          this.check(res.id !== this.tRequest.command.id, 'Invalid "id": ' + res.id);
          this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
        } catch (err) {
          this.tlogErrorAndAbort('getIr', 'GET_IR', err);
        }
      });
    } catch (err) {
      this.tlogErrorAndAbort('getIr', 'GET_IR', err);
    }

    await timeout_ms(300);

    try {
      this.sRequest.command = {"cm": 2, "id": 1, "ch": 3};
      const resp = await this.sSocket.remoteRequest(this.uri, this.sRequest);
      let res = JSON.parse(resp);

      this.check(res.sender !== this.sRequest.recipient, 'Invalid "sender": ' + res.sender);
      this.check(res.recipient !== this.sRequest.sender, 'Invalid "recipient": ' + res.recipient);
      this.check(res.messageId !== this.sRequest.messageId, 'Invalid "messageId": ' + res.messageId);
  
      res = res.payload.command;

      this.check(res.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + res.cm);
      this.check(res.id !== this.sRequest.command.id, 'Invalid "id": ' + res.id);
      this.check(res.ch !== this.sRequest.command.ch, 'Invalid "ch": ' + res.ch);
      this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
    } catch (err) {
      this.slogErrorAndAbort('getIr', 'SET_IR', err);
    }
  }

  public async sSetIr() {
    try {
      this.sRequest.command = {"cm": 2, "id": 1, "ch": 3};
      const resp = await this.sSocket.remoteRequest(this.uri, this.sRequest);
      let res = JSON.parse(resp);

      this.check(res.sender !== this.sRequest.recipient, 'Invalid "sender": ' + res.sender);
      this.check(res.recipient !== this.sRequest.sender, 'Invalid "recipient": ' + res.recipient);
      this.check(res.messageId !== this.sRequest.messageId, 'Invalid "messageId": ' + res.messageId);
  
      res = res.payload.command;

      this.check(res.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + res.cm);
      this.check(res.id !== this.sRequest.command.id, 'Invalid "id": ' + res.id);
      this.check(res.ch !== this.sRequest.command.ch, 'Invalid "ch": ' + res.ch);
      this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
    } catch (err) {
      this.slogErrorAndAbort('setIr', 'SET_IR', err);
    }
  }

  public async tSetIr() {
    try {
      this.tRequest.command = {"cm": 2, "id": 1, "ch": 3};
      const resp = await this.tSocket.remoteRequest(this.uri, this.tRequest);
      let res = JSON.parse(resp);

      this.check(res.sender !== this.tRequest.recipient, 'Invalid "sender": ' + res.sender);
      this.check(res.recipient !== this.tRequest.sender, 'Invalid "recipient": ' + res.recipient);
      this.check(res.messageId !== this.tRequest.messageId, 'Invalid "messageId": ' + res.messageId);
  
      res = res.payload.command;

      this.check(res.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + res.cm);
      this.check(res.id !== this.tRequest.command.id, 'Invalid "id": ' + res.id);
      this.check(res.ch !== this.tRequest.command.ch, 'Invalid "ch": ' + res.ch);
      this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
    } catch (err) {
      this.tlogErrorAndAbort('setIr', 'SET_IR', err);
    }
  }

  public async setIr() {
    await this.prepare();
    this.sSetIr();
    if (this.tDev.isTicketSet()) {
      this.tSetIr();
    }
  }

  public async sGetInfo() {
    try {
      this.sRequest.command = {"cm": 3};
      const resp = await this.sSocket.remoteRequest(this.uri, this.sRequest);
      const pResp = JSON.parse(resp).mg;

      // this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      // this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
      // this.check(pResp.ch !== this.sRequest.command.ch, 'Invalid "ch": ' + pResp.ch);
      // this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('getInfo', 'GET_INFO', err);
    }
  }

  public async tGetInfo() {
    try {
      this.tRequest.command = {"cm": 3};
      const resp = await this.tSocket.remoteRequest(this.uri, this.tRequest);
      const pResp = JSON.parse(resp).mg;

      // this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      // this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
      // this.check(pResp.ch !== this.sRequest.command.ch, 'Invalid "ch": ' + pResp.ch);
      // this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.tlogErrorAndAbort('getInfo', 'GET_INFO', err);
    }
  }

  public async getInfo() {
    await this.prepare();
    this.sGetInfo();
    if (this.tDev.isTicketSet()) {
      this.tGetInfo();
    }
  }

  public async tCancelIr() {
    try {
      this.tRequest.command = {"cm": 1};
      this.tSocket.remoteRequest(this.uri, this.tRequest).then(resp => {
        let res = JSON.parse(resp);

        this.check(res.sender !== this.tRequest.recipient, 'Invalid "sender": ' + res.sender);
        this.check(res.recipient !== this.tRequest.sender, 'Invalid "recipient": ' + res.recipient);
        this.check(res.messageId !== this.tRequest.messageId, 'Invalid "messageId": ' + res.messageId);
    
        res = res.payload.command;
  
        this.check(res.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + res.cm);
        this.check(res.id !== 0, 'Invalid "id": ' + res.id);
        this.check(res.mg !== 'cancel', 'Invalid "mg": ' + res.mg);
      });
    } catch (err) {
      this.tlogErrorAndAbort('cancelIr', 'GET_IR', err);
    }

    try {
      this.tRequest.command = {"cm": 4};
      const resp = await this.tSocket.remoteRequest(this.uri, this.tRequest);
      let res = JSON.parse(resp);

      this.check(res.sender !== this.tRequest.recipient, 'Invalid "sender": ' + res.sender);
      this.check(res.recipient !== this.tRequest.sender, 'Invalid "recipient": ' + res.recipient);
      this.check(res.messageId !== this.tRequest.messageId, 'Invalid "messageId": ' + res.messageId);
  
      res = res.payload.command;

      this.check(res.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + res.cm);
      this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
    } catch (err) {
      this.tlogErrorAndAbort('cancelIr', 'CANCEL_IR', err);
    }
  }

  public async sCancelIr() {
    try {
      this.sRequest.command = {"cm": 1};
      this.sSocket.remoteRequest(this.uri, this.sRequest).then(resp => {
        let res = JSON.parse(resp);

        this.check(res.sender !== this.sRequest.recipient, 'Invalid "sender": ' + res.sender);
        this.check(res.recipient !== this.sRequest.sender, 'Invalid "recipient": ' + res.recipient);
        this.check(res.messageId !== this.sRequest.messageId, 'Invalid "messageId": ' + res.messageId);
    
        res = res.payload.command;
  
        this.check(res.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + res.cm);
        this.check(res.id !== 0, 'Invalid "id": ' + res.id);
        this.check(res.mg !== 'cancel', 'Invalid "mg": ' + res.mg);
      });
    } catch (err) {
      this.slogErrorAndAbort('cancelIr', 'GET_IR', err);
    }

    try {
      this.sRequest.command = {"cm": 4};
      const resp = await this.sSocket.remoteRequest(this.uri, this.sRequest);
      let res = JSON.parse(resp);

      this.check(res.sender !== this.sRequest.recipient, 'Invalid "sender": ' + res.sender);
      this.check(res.recipient !== this.sRequest.sender, 'Invalid "recipient": ' + res.recipient);
      this.check(res.messageId !== this.sRequest.messageId, 'Invalid "messageId": ' + res.messageId);
  
      res = res.payload.command;

      this.check(res.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + res.cm);
      this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
    } catch (err) {
      this.slogErrorAndAbort('cancelIr', 'CANCEL_IR', err);
    }
  }

  public async cancelIr() {
    await this.prepare();
    this.sCancelIr();
    if (this.tDev.isTicketSet()) {
      this.tCancelIr();
    }
  }

  public async editIr() {
    // await this.prepare();

    // try {
    //   this.tRequest.command = {"cm": 5, "id": 1};
    //   const resp = await this.tSocket.remoteRequest(this.uri, this.tRequest).then(resp => {
    //     const pResp = JSON.parse(resp).mg;

    //     this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
    //     this.check(pResp.id !== this.tRequest.command.id, 'Invalid "id": ' + pResp.id);
    //     this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    //   });
    // } catch (err) {
    //   this.tlogErrorAndAbort('editIr', 'EDIT_IR', err);
    // }

    // try {
    //   this.sRequest.command = {"cm": 4};
    //   await this.sSocket.open(`ws://${this.tUri}/ws`, this.sMyPrivKey);
    //   const socket = await this.sSocket.send(this.sRequest, this.sDevPubKeyPem);
    //   const resp = await this.sSocket.receive(socket);
    //   const pResp = JSON.parse(resp).mg;

    //   this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
    //   this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    // } catch (err) {
    //   this.slogErrorAndAbort('editIr', 'SET_IR', err);
    // }
  }

  public async sRunScene() {
    try {
      this.sRequest.command = {"cm":6,"sc":[{"dy":0,"id": 1,"ch":3}]};
      const resp = await this.sSocket.remoteRequest(this.uri, this.sRequest);
      let res = JSON.parse(resp);

      this.check(res.sender !== this.sRequest.recipient, 'Invalid "sender": ' + res.sender);
      this.check(res.recipient !== this.sRequest.sender, 'Invalid "recipient": ' + res.recipient);
      this.check(res.messageId !== this.sRequest.messageId, 'Invalid "messageId": ' + res.messageId);
  
      res = res.payload.command;

      this.check(res.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + res.cm);
      this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
    } catch (err) {
      this.slogErrorAndAbort('runScene', 'RUN_SCENE', err);
    }
  }

  public async tRunScene() {
    try {
      this.tRequest.command = {"cm":6,"sc":[{"dy":0,"id": 1,"ch":3}]};
      const resp = await this.tSocket.remoteRequest(this.uri, this.tRequest);
      let res = JSON.parse(resp);

      this.check(res.sender !== this.tRequest.recipient, 'Invalid "sender": ' + res.sender);
      this.check(res.recipient !== this.tRequest.sender, 'Invalid "recipient": ' + res.recipient);
      this.check(res.messageId !== this.tRequest.messageId, 'Invalid "messageId": ' + res.messageId);
  
      res = res.payload.command;

      this.check(res.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + res.cm);
      this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
    } catch (err) {
      this.tlogErrorAndAbort('runScene', 'RUN_SCENE', err);
    }
  }

  public async runScene() {
    await this.prepare();
    this.sRunScene();
    if (this.tDev.isTicketSet()) {
      this.tRunScene();
    }
  }

  public async infrared() {
    try {
      this.sRequest.command = VIEW_IR_REQ;
      let resp = await this.sSocket.remoteRequest(this.uri, this.sRequest);
      let pResp = JSON.parse(resp).command;

      const srcCode = pResp.raw;
      const srcFreq = pResp.f;
      const srcLen = pResp.l;

      await timeout_ms(500);

      this.sRequest.command = GET_IR_REQ;
      this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
    
      await timeout_ms(300);
    
      this.tRequest.command = SET_IR_REQ;
      resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);

      await timeout_ms(300);

      this.tRequest.command = GET_IR_REQ;
      this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);

      this.sRequest.command = SET_IR_REQ;
      resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
    
      VIEW_IR_REQ.id = 2;
      
      this.tRequest.command = VIEW_IR_REQ;
      resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      pResp = JSON.parse(resp).command;

      this.check(pResp.cm !== VIEW_IR_REQ.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.id !== 2, 'Invalid "id": ' + pResp.id);
      this.check(checkBurst(parse2hex(pResp.raw, getLength(pResp.raw)), parse2hex(srcCode, getLength(srcCode))), 'Invalid "code": ' + pResp.raw);
      this.check(pResp.l !== srcLen, 'Invalid length: ' + pResp.l);
      this.check(checkFrequency(srcFreq, pResp.f), 'Invalid frequency: ' + pResp.f);
    } catch (err) {
      this.slogErrorAndAbort('infrared', 'INFRARED', err);
      this.tlogErrorAndAbort('infrared', 'INFRARED', err);
    }
  }

  private async sEraseAllIr() {
    try {
      this.sRequest.command = {"cm": 0, "id": 0};
      const resp = await this.sSocket.remoteRequest(this.uri, this.sRequest);
      let res = JSON.parse(resp);

      this.check(res.sender !== this.sRequest.recipient, 'Invalid "sender": ' + res.sender);
      this.check(res.recipient !== this.sRequest.sender, 'Invalid "recipient": ' + res.recipient);
      this.check(res.messageId !== this.sRequest.messageId, 'Invalid "messageId": ' + res.messageId);
  
      res = res.payload.command;

      this.check(res.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + res.cm);
      this.check(res.id !== this.sRequest.command.id, 'Invalid "id": ' + res.id);
      this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
    } catch (err) {
      this.slogErrorAndAbort('eraseAllIr', 'ERASE_IR_ALL', err);
    }
  }

  private async tEraseAllIr() {
    try {
      this.tRequest.command = {"cm": 0, "id": 0};
      const resp = await this.tSocket.remoteRequest(this.uri, this.tRequest);
      let res = JSON.parse(resp);

      this.check(res.sender !== this.tRequest.recipient, 'Invalid "sender": ' + res.sender);
      this.check(res.recipient !== this.tRequest.sender, 'Invalid "recipient": ' + res.recipient);
      this.check(res.messageId !== this.tRequest.messageId, 'Invalid "messageId": ' + res.messageId);
  
      res = res.payload.command;

      this.check(res.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + res.cm);
      this.check(res.id !== this.tRequest.command.id, 'Invalid "id": ' + res.id);
      this.check(res.mg !== 'success', 'Invalid "mg": ' + res.mg);
    } catch (err) {
      this.tlogErrorAndAbort('eraseAllIr', 'ERASE_IR_ALL', err);
    }
  }

  private async eraseAllIr() {
    await this.sEraseAllIr();
    if (this.tDev.isTicketSet()) {
      await this.tEraseAllIr();
    }
  }

  private async sSaveIr(index: number) {
    try { 
      this.sRequest.command = {"cm": 187};
      let raw = removePreamble(code[index]);
      let f = getFrequency(code[index]);
      this.sRequest.command.code = parse2hex(raw, getLength(raw));
      this.sRequest.command.f = f;
      this.sRequest.command.l = getLength(raw);

      const resp = await this.sSocket.remoteRequest(this.uri, this.sRequest);
      const pResp = JSON.parse(resp).mg;

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
    } catch (err) {
      this.slogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  private async tSaveIr(index: number) {
    try { 
      this.tRequest.command = {"cm": 187};
      let raw = removePreamble(code[index]);
      let f = getFrequency(code[index]);
      this.tRequest.command.code = parse2hex(raw, getLength(raw));
      this.tRequest.command.f = f;
      this.tRequest.command.l = getLength(raw);

      const resp = await this.tSocket.remoteRequest(this.uri, this.tRequest);
      const pResp = JSON.parse(resp).mg;

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
    } catch (err) {
      this.tlogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  private async prepare() {
    await this.eraseAllIr();
    await this.sSaveIr(1); 
    if (this.tDev.isTicketSet()) {
      await this.tSaveIr(1);  
    }
  }

  private check(test, mg: string) {
    if (test)
      throw mg;
  }

  private slogErrorAndAbort(api, test, mg) {
    const date = new Date();
    const err = `[${date.toLocaleTimeString()}] [RT] (${api}) ${test}: FAIL. ${mg}\n\r.`;
    this.red(err, this.sTerm);
    this.sError$.next(err);
  }

  private tlogErrorAndAbort(api, test, mg) {
    const date = new Date();
    const err = `[${date.toLocaleTimeString()}] [RT] (${api}) ${test}: FAIL. ${mg}\n\r.`;
    this.red(err, this.tTerm);
    this.tError$.next(err);
  }
  
  public sTestFail$(): Observable<string> {
    return this.sError$.asObservable();
  }

  public tTestFail$(): Observable<string> {
    return this.tError$.asObservable();
  }

  private red(text: string, term) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    term.write(Colors.red);
    term.write(utf8);
    term.write('\r\n');
  }
}