import { DeviceService } from "../../device/device";
import { getLength, getFrequency, getFirstBurst, getSecondBurst, removePreamble, parse2hex, checkBurst, checkFrequency} from "../ir-utils";
import { code } from '../ir-codes';
import { Observable, Subject } from 'rxjs';
import { timeout_ms } from "../../../utils/utils";
import { Cast } from '../../../utils/cast';
import { GET_INFO_REQ, GET_IR_REQ, CANCEL_IR_REQ, SET_IR_REQ, EDIT_IR_REQ, ERASE_IR_REQ, ERASE_ALL_IR_REQ, RUN_SCENE_REQ, FAC_RESET_REQ, SAVE_IR_REQ, VIEW_IR_REQ, GET_HEAP_REQ, RESET_REQ, BLE_ON_REQ, BLE_OFF_REQ, FIND_ME_REQ } from '../requests'
import { Log } from '../../../utils/log';

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

  public async startTests() {
    this.start('ONE_LOCAL_TEST');

    await this.getInfo();
    if (this.tDev.isTicketSet()) {
      await this.getIr();
    }
    await this.setIr();
    await this.cancelIr();
    if (this.tDev.isTicketSet()) {
      await this.editIr();
    }
    
    await this.runScene();
    await this.infrared();
    await this.bleOnOff();
    await timeout_ms(3000);
    await this.findMe();
    await timeout_ms(500);
    this.end();
  }

  public async sEraseIr() {
    try {
      this.sRequest.command = ERASE_IR_REQ;

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
      this.tRequest.command = ERASE_IR_REQ;
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
      this.tRequest.command = GET_IR_REQ;
      this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem).then(resp => {
        const pResp = JSON.parse(resp);

        this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.id !== 2, 'Invalid "id": ' + pResp.id);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      });
    } catch (err) {
      this.tlogErrorAndAbort('getIr', 'GET_IR', err);
    }

    await timeout_ms(300);

    try {
      this.sRequest.command = SET_IR_REQ;
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
      this.sRequest.command = SET_IR_REQ;
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
      this.tRequest.command = SET_IR_REQ;
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
      this.sRequest.command = GET_INFO_REQ;
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
      this.tRequest.command = GET_INFO_REQ;
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
      this.tRequest.command = GET_IR_REQ;
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
      this.tRequest.command = CANCEL_IR_REQ;
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
      this.sRequest.command = GET_IR_REQ;
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
      this.sRequest.command = CANCEL_IR_REQ;
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
      this.tRequest.command = EDIT_IR_REQ;
      this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem).then(resp => {
        const pResp = JSON.parse(resp);

        this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.id !== this.tRequest.command.id, 'Invalid "id": ' + pResp.id);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      });
    } catch (err) {
      this.tlogErrorAndAbort('editIr', 'EDIT_IR', err);
    }

    await timeout_ms(500);

    try {
      this.tRequest.command = SET_IR_REQ;
      const resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.tlogErrorAndAbort('editIr', 'SET_IR', err);
    }
  }

  public async sRunScene() {
    try {
      this.sRequest.command = RUN_SCENE_REQ;
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
      this.tRequest.command = RUN_SCENE_REQ;
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

  public async infrared() {
    try {
      this.sRequest.command = VIEW_IR_REQ;
      let resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      let pResp = JSON.parse(resp);

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
      pResp = JSON.parse(resp);

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

  private async sbleOnOff() {
    try {
      this.sRequest.command = BLE_ON_REQ;
      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('bleOnOff', 'BLE_ON', err);
    }

    await timeout_ms(500);

    try {
      this.sRequest.command = BLE_OFF_REQ;
      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('bleOnOff', 'BLE_OFF', err);
    }
  }

  private async tbleOnOff() {
    try {
      this.tRequest.command = BLE_ON_REQ;
      const resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.tlogErrorAndAbort('bleOnOff', 'BLE_ON', err);
    }

    await timeout_ms(500);

    try {
      this.tRequest.command = BLE_OFF_REQ;
      const resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.tlogErrorAndAbort('bleOnOff', 'BLE_OFF', err);
    }
  }

  private async bleOnOff() {
    this.sbleOnOff();
    if (this.tDev.isTicketSet()) {
      this.tbleOnOff();
    }
  }

  private async sFindMe() {
    try {
      this.sRequest.command = FIND_ME_REQ;
      const resp = await this.sSocket.localRequest(`ws://${this.sUri}/ws`, this.sRequest, this.sMyPrivKey, this.sDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('findMe', 'FIND_ME', err);
    }
  }

  private async tFindMe() {
    try {
      this.tRequest.command = FIND_ME_REQ;
      const resp = await this.tSocket.localRequest(`ws://${this.tUri}/ws`, this.tRequest, this.tMyPrivKey, this.tDevPubKeyPem);
      const pResp = JSON.parse(resp);

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.tlogErrorAndAbort('findMe', 'FIND_ME', err);
    }
  }

  private async findMe() {
    this.sFindMe();
    if (this.tDev.isTicketSet()) {
      this.tFindMe();
    }
  }

  private async sEraseAllIr() {
    try {
      this.sRequest.command = ERASE_ALL_IR_REQ;
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
      this.tRequest.command = ERASE_ALL_IR_REQ;
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
      this.sRequest.command = SAVE_IR_REQ;
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
      this.tRequest.command = SAVE_IR_REQ;
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

  private start(api: string) {
    const date = new Date();
    const err = `[${date.toLocaleTimeString()}] *************** STARTING ${api} ***************\r\n`;
    Log.cyan(err, this.sTerm);
    Log.cyan(err, this.tTerm);

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
  }

  private end() {
    const date = new Date();

    const err = `[${date.toLocaleTimeString()}] [LT] ONE_LOCAL_TEST: `;
    Log.cyan(err, this.sTerm);
    Log.cyan(err, this.tTerm);

    if (this.error == true) {
      var msg = 'FAIL.\r\n';
      Log.red(msg, this.sTerm);
      Log.red(msg, this.tTerm);
    } else {
      var msg = 'PASS.\r\n';
      Log.green(msg, this.sTerm);
      Log.green(msg, this.tTerm);
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
    const err = `[${date.toLocaleTimeString()}] [LT] (${api}) ${test}: FAIL. ${mg}\n\r`;
    Log.red(err, this.sTerm);

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
    const err = `[${date.toLocaleTimeString()}] [LT] (${api}) ${test}: FAIL. ${mg}\n\r`;
    Log.red(err, this.tTerm);

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
}