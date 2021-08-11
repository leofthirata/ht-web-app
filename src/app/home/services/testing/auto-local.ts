import { DeviceService } from "../device/device";
import { getLength, getFrequency, getFirstBurst, getSecondBurst, removePreamble, parse2hex, checkBurst, checkFrequency} from "./ir-utils";
import { code } from './ir-codes';
import { Observable, Subject } from 'rxjs';
import { timeout_ms } from "../../utils/utils";
import { Cast } from '../../utils/cast';
import * as Colors from '../../utils/color';

export class oneLocal {
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
  private error = false;

  private sError$ = new Subject<string>();
  private tError$ = new Subject<string>();

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

    this.sRequest = { "token": this.sToken, "key": this.sMyPubKeyPem };
    this.tRequest = { "token": this.tToken, "key": this.tMyPubKeyPem };
  
    console.log(this.sMyPrivKey);
    console.log(this.sDevPubKeyPem);
  }

  public async start() {
    const date = new Date();
    const err = `[${date.toLocaleTimeString()}] *************** STARTING ONE_LOCAL_TEST ***************\r\n`;
    this.cyan(err, this.sTerm);
    this.cyan(err, this.tTerm);

    const logger = new Uint8Array(this.sDev.getLogger().length + err.length);
    logger.set(this.sDev.getLogger());
    const err_buf = Cast.stringToBytes(err);
    logger.set(err_buf, this.sDev.getLogger().length);
    this.sDev.updateLogger(logger);

    const logger2 = new Uint8Array(this.tDev.getLogger().length + err.length);
    logger2.set(this.tDev.getLogger());
    const err_buf2 = Cast.stringToBytes(err);
    logger2.set(err_buf2, this.tDev.getLogger().length);
    this.tDev.updateLogger(logger2);

    await this.getInfo();
    await this.getIr();
    await this.setIr();
    await this.cancelIr();
    // await this.editIr();
    await this.runScene();
    this.end();
  }

  public async sEraseIr() {
    try {
      this.sRequest.command = {"cm": 0, "id": 1};

      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('eraseIr', 'ERASE_IR', err);
    }
  }

  public async tEraseIr() {
    try {
      this.tRequest.command = {"cm": 0, "id": 1};
      const resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.id !== this.tRequest.command.id, 'Invalid "id": ' + pResp.id);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
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
      this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem).then(resp => {
        const pResp = JSON.parse(resp);

        this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.id !== 1, 'Invalid "id": ' + pResp.id);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      });
    } catch (err) {
      this.tlogErrorAndAbort('getIr', 'GET_IR', err);
    }

    await timeout_ms(300);

    try {
      this.sRequest.command = {"cm": 2, "id": 1, "ch": 3};
      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
      this.check(pResp.ch !== this.sRequest.command.ch, 'Invalid "ch": ' + pResp.ch);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('getIr', 'SET_IR', err);
    }
  }

  public async sSetIr() {
    try {
      this.sRequest.command = {"cm": 2, "id": 1, "ch": 3};
      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
      this.check(pResp.ch !== this.sRequest.command.ch, 'Invalid "ch": ' + pResp.ch);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('setIr', 'SET_IR', err);
    }
  }

  public async tSetIr() {
    try {
      this.tRequest.command = {"cm": 2, "id": 1, "ch": 3};
      const resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.id !== this.tRequest.command.id, 'Invalid "id": ' + pResp.id);
      this.check(pResp.ch !== this.tRequest.command.ch, 'Invalid "ch": ' + pResp.ch);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.tlogErrorAndAbort('setIr', 'SET_IR', err);
    }
  }

  public async setIr() {
    await this.prepare();
    await this.sSetIr();
    if (this.tDev.isTicketSet()) {
      await this.tSetIr();
    }
  }

  public async sGetInfo() {
    try {
      this.sRequest.command = {"cm": 3};
      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

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
      const resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      const pResp = JSON.parse(resp);

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
    await this.sGetInfo();
    if (this.tDev.isTicketSet()) {
      await this.tGetInfo();
    }
  }

  public async tCancelIr() {
    try {
      this.tRequest.command = {"cm": 1};
      this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem).then(resp => {
        const pResp = JSON.parse(resp);

        this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.id !== 0, 'Invalid "id": ' + pResp.id);
        this.check(pResp.mg !== 'cancel', 'Invalid "mg": ' + pResp.mg);
      });
    } catch (err) {
      this.tlogErrorAndAbort('cancelIr', 'GET_IR', err);
    }

    try {
      this.tRequest.command = {"cm": 4};
      const resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.tlogErrorAndAbort('cancelIr', 'CANCEL_IR', err);
    }
  }

  public async sCancelIr() {
    try {
      this.sRequest.command = {"cm": 1};
      this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem).then(resp => {
        const pResp = JSON.parse(resp);

        this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.id !== 0, 'Invalid "id": ' + pResp.id);
        this.check(pResp.mg !== 'cancel', 'Invalid "mg": ' + pResp.mg);
      });
    } catch (err) {
      this.slogErrorAndAbort('cancelIr', 'GET_IR', err);
    }

    try {
      this.sRequest.command = {"cm": 4};
      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('cancelIr', 'CANCEL_IR', err);
    }
  }

  public async cancelIr() {
    await this.prepare();
    await this.sCancelIr();
    if (this.tDev.isTicketSet()) {
      await this.tCancelIr();
    }
  }

  public async editIr() {
    await this.prepare();

    try {
      this.tRequest.command = {"cm": 5, "id": 1};
      this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem).then(resp => {
        const pResp = JSON.parse(resp);

        this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.id !== this.tRequest.command.id, 'Invalid "id": ' + pResp.id);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      });
    } catch (err) {
      this.tlogErrorAndAbort('editIr', 'EDIT_IR', err);
    }

    try {
      this.sRequest.command = {"cm": 4};
      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('editIr', 'SET_IR', err);
    }
  }

  public async sRunScene() {
    try {
      this.sRequest.command = {"cm":6,"sc":[{"dy":0,"id": 1,"ch":3}]};
      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('runScene', 'RUN_SCENE', err);
    }
  }

  public async tRunScene() {
    try {
      this.tRequest.command = {"cm":6,"sc":[{"dy":0,"id": 1,"ch":3}]};
      const resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.tlogErrorAndAbort('runScene', 'RUN_SCENE', err);
    }
  }

  public async runScene() {
    await this.prepare();
    await this.sRunScene();
    if (this.tDev.isTicketSet()) {
      await this.tRunScene();
    }
  }

  private async sEraseAllIr() {
    try {
      this.sRequest.command = {"cm": 0, "id": 0};
      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('eraseAllIr', 'ERASE_IR_ALL', err);
    }
  }

  private async tEraseAllIr() {
    try {
      this.tRequest.command = {"cm": 0, "id": 0};
      const resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.id !== this.tRequest.command.id, 'Invalid "id": ' + pResp.id);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
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

      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

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

      const resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      const pResp = JSON.parse(resp);

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

  private end() {
    const date = new Date();

    const err = `[${date.toLocaleTimeString()}] [LT] ONE_LOCAL_TEST: `;
    this.cyan(err, this.sTerm);
    this.cyan(err, this.tTerm);

    if (this.error == true) {
      var msg = 'FAIL.\r\n';
      this.red(msg, this.sTerm);
      this.red(msg, this.tTerm);
    } else {
      var msg = 'PASS.\r\n';
      this.green(msg, this.sTerm);
      this.green(msg, this.tTerm);
    }

    const logger = new Uint8Array(this.sDev.getLogger().length + err.length + msg.length);
    logger.set(this.sDev.getLogger());
    const err_buf = Cast.stringToBytes(err + msg);
    logger.set(err_buf, this.sDev.getLogger().length);
    this.sDev.updateLogger(logger);

    const logger2 = new Uint8Array(this.tDev.getLogger().length + err.length + msg.length);
    logger2.set(this.tDev.getLogger());
    const err_buf2 = Cast.stringToBytes(err + msg);
    logger2.set(err_buf2, this.tDev.getLogger().length);
    this.tDev.updateLogger(logger2);

    this.error = false;
  }

  private slogErrorAndAbort(api, test, mg) {
    const date = new Date();
    const err = `[${date.toLocaleTimeString()}] [LT] (${api}) ${test}: FAIL. ${mg}\n\r.`;
    this.red(err, this.sTerm);

    const logger = new Uint8Array(this.sDev.getLogger().length + err.length);
    logger.set(this.sDev.getLogger());
    const err_buf = Cast.stringToBytes(err);
    logger.set(err_buf, this.sDev.getLogger().length);
    this.sDev.updateLogger(logger);

    this.error = true;
    // this.sError$.next(err);
  }

  private tlogErrorAndAbort(api, test, mg) {
    const date = new Date();
    const err = `[${date.toLocaleTimeString()}] [LT] (${api}) ${test}: FAIL. ${mg}\n\r.`;
    this.red(err, this.tTerm);

    const logger = new Uint8Array(this.tDev.getLogger().length + err.length);
    logger.set(this.tDev.getLogger());
    const err_buf = Cast.stringToBytes(err);
    logger.set(err_buf, this.tDev.getLogger().length);
    this.tDev.updateLogger(logger);

    this.error = true;
    // this.tError$.next(err);
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

  private green(text: string, term) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    term.write(Colors.green);
    term.write(utf8);
    term.write('\r\n');
  }

  private cyan(text: string, term) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    term.write(Colors.cyan);
    term.write(utf8);
  }
}