import { DeviceService } from "../device/device";
import { Cast } from '../../utils/cast';
import * as Colors from '../../utils/color';
import { getLength, getFrequency, getFirstBurst, getSecondBurst, removePreamble, parse2hex, checkBurst, checkFrequency} from "./ir-utils";
import { code } from './ir-codes';
import { Observable, Subject } from 'rxjs';
import { timeout_ms } from "../../utils/utils";

export class oneLocalStress {
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

  constructor(source: DeviceService, sTerminal, target: DeviceService, tTerminal) {
    this.sTerm = sTerminal;
    this.tTerm = tTerminal;

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
  }

  public async eraseIr() {
    this.prepare();

    for(let i = 0; i < 148; i++) {
      try {
        this.tRequest.command = {"cm": 0, "id": 1};
        await this.tSocket.open(`ws://${this.tUri}/ws`, this.tMyPrivKey);
        const socket = await this.tSocket.send(this.tRequest, this.tDevPubKeyPem);
        const resp = await this.tSocket.receive(socket);
        const pResp = JSON.parse(resp).mg;

        this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      } catch (err) {
        this.slogErrorAndAbort('eraseIr', 'ERASE_IR', err);
      }
      if (this.stopTesting) {
        break;
      }
    }
  }

  public async getIr() {
    this.prepare();

    for(let i = 0; i < 148; i++) {
      try {
        this.tRequest.command = {"cm": 1};
        await this.tSocket.open(`ws://${this.tUri}/ws`, this.tMyPrivKey);
        const socket = await this.tSocket.send(this.tRequest, this.tDevPubKeyPem);
        this.tSocket.receive(socket).then(resp => {
          const pResp = JSON.parse(resp).mg;

          this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
          this.check(pResp.id !== i+1, 'Invalid "id": ' + pResp.id);
          this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
        });
      } catch (err) {
        this.tlogErrorAndAbort('getIr', 'GET_IR', err);
      }

      await timeout_ms(300);

      try {
        this.sRequest.command = {"cm": 2, "id": 1, "ch": 3};
        await this.sSocket.open(`ws://${this.sUri}/ws`, this.sMyPrivKey);
        const socket = await this.sSocket.send(this.sRequest, this.sDevPubKeyPem);
        const resp = await this.sSocket.receive(socket);
        const pResp = JSON.parse(resp).mg;

        this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
        this.check(pResp.ch !== this.sRequest.command.ch, 'Invalid "ch": ' + pResp.ch);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      } catch (err) {
        this.slogErrorAndAbort('getIr', 'SET_IR', err);
      }
      if (this.stopTesting) {
        break;
      }
    }
  }

  public async setIr() {
    this.prepare();

    for(let i = 0; i < 100; i++) {
      try {
        this.sRequest.command = {"cm": 2, "id": 1, "ch": 3};
        await this.sSocket.open(`ws://${this.sUri}/ws`, this.sMyPrivKey);
        const socket = await this.sSocket.send(this.sRequest, this.sDevPubKeyPem);
        const resp = await this.sSocket.receive(socket);
        const pResp = JSON.parse(resp).mg;

        this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
        this.check(pResp.ch !== this.sRequest.command.ch, 'Invalid "ch": ' + pResp.ch);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      } catch (err) {
        this.slogErrorAndAbort('setIr', 'SET_IR', err);
      }

      try {
        this.tRequest.command = {"cm": 2, "id": 1, "ch": 3};
        await this.tSocket.open(`ws://${this.tUri}/ws`, this.tMyPrivKey);
        const socket = await this.tSocket.send(this.tRequest, this.tDevPubKeyPem);
        const resp = await this.tSocket.receive(socket);
        const pResp = JSON.parse(resp).mg;

        this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.id !== this.tRequest.command.id, 'Invalid "id": ' + pResp.id);
        this.check(pResp.ch !== this.tRequest.command.ch, 'Invalid "ch": ' + pResp.ch);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      } catch (err) {
        this.tlogErrorAndAbort('setIr', 'SET_IR', err);
      }
      if (this.stopTesting) {
        break;
      }
    }
  }

  public async getInfo() {
    this.prepare();

    for(let i = 0; i < 100; i++) {
      try {
        this.sRequest.command = {"cm": 3};
        await this.sSocket.open(`ws://${this.sUri}/ws`, this.sMyPrivKey);
        const socket = await this.sSocket.send(this.sRequest, this.sDevPubKeyPem);
        const resp = await this.sSocket.receive(socket);
        const pResp = JSON.parse(resp).mg;

        // this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        // this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
        // this.check(pResp.ch !== this.sRequest.command.ch, 'Invalid "ch": ' + pResp.ch);
        // this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      } catch (err) {
        this.slogErrorAndAbort('getInfo', 'GET_INFO', err);
      }

      try {
        this.tRequest.command = {"cm": 3};
        await this.tSocket.open(`ws://${this.tUri}/ws`, this.tMyPrivKey);
        const socket = await this.tSocket.send(this.tRequest, this.tDevPubKeyPem);
        const resp = await this.tSocket.receive(socket);
        const pResp = JSON.parse(resp).mg;

        // this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        // this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
        // this.check(pResp.ch !== this.sRequest.command.ch, 'Invalid "ch": ' + pResp.ch);
        // this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      } catch (err) {
        this.tlogErrorAndAbort('getInfo', 'GET_INFO', err);
      }
      if (this.stopTesting) {
        break;
      }
    }
  }

  public async cancelIr() {
    this.prepare();

    for(let i = 0; i < 100; i++) {
      try {
        this.tRequest.command = {"cm": 1};
        await this.tSocket.open(`ws://${this.tUri}/ws`, this.tMyPrivKey);
        const socket = await this.tSocket.send(this.tRequest, this.tDevPubKeyPem);
        this.tSocket.receive(socket).then(resp => {
          const pResp = JSON.parse(resp).mg;

          this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
          this.check(pResp.id !== 0, 'Invalid "id": ' + pResp.id);
          this.check(pResp.mg !== 'cancel', 'Invalid "mg": ' + pResp.mg);
        });
      } catch (err) {
        this.tlogErrorAndAbort('cancelIr', 'GET_IR', err);
      }

      try {
        this.tRequest.command = {"cm": 4};
        await this.tSocket.open(`ws://${this.tUri}/ws`, this.tMyPrivKey);
        const socket = await this.tSocket.send(this.tRequest, this.tDevPubKeyPem);
        const resp = await this.tSocket.receive(socket);
        const pResp = JSON.parse(resp).mg;

        this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      } catch (err) {
        this.tlogErrorAndAbort('cancelIr', 'CANCEL_IR', err);
      }

      try {
        this.sRequest.command = {"cm": 1};
        await this.sSocket.open(`ws://${this.sUri}/ws`, this.sMyPrivKey);
        const socket = await this.sSocket.send(this.sRequest, this.sDevPubKeyPem);
        this.sSocket.receive(socket).then(resp => {
          const pResp = JSON.parse(resp).mg;

          this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
          this.check(pResp.id !== 0, 'Invalid "id": ' + pResp.id);
          this.check(pResp.mg !== 'cancel', 'Invalid "mg": ' + pResp.mg);
        });
      } catch (err) {
        this.slogErrorAndAbort('cancelIr', 'GET_IR', err);
      }

      try {
        this.sRequest.command = {"cm": 4};
        await this.sSocket.open(`ws://${this.sUri}/ws`, this.sMyPrivKey);
        const socket = await this.sSocket.send(this.sRequest, this.sDevPubKeyPem);
        const resp = await this.sSocket.receive(socket);
        const pResp = JSON.parse(resp).mg;

        this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      } catch (err) {
        this.slogErrorAndAbort('cancelIr', 'CANCEL_IR', err);
      }
      if (this.stopTesting) {
        break;
      }
    }
  }

  public async editIr() {
    this.prepare();

    for(let i = 0; i < 100; i++) {
      try {
        this.tRequest.command = {"cm": 5, "id": 1};
        await this.tSocket.open(`ws://${this.tUri}/ws`, this.tMyPrivKey);
        const socket = await this.tSocket.send(this.tRequest, this.tDevPubKeyPem);
        this.tSocket.receive(socket).then(resp => {
          const pResp = JSON.parse(resp).mg;

          this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
          this.check(pResp.id !== this.tRequest.command.id, 'Invalid "id": ' + pResp.id);
          this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
        });
      } catch (err) {
        this.tlogErrorAndAbort('editIr', 'EDIT_IR', err);
      }

      try {
        this.sRequest.command = {"cm": 4};
        await this.sSocket.open(`ws://${this.tUri}/ws`, this.sMyPrivKey);
        const socket = await this.sSocket.send(this.sRequest, this.sDevPubKeyPem);
        const resp = await this.sSocket.receive(socket);
        const pResp = JSON.parse(resp).mg;

        this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      } catch (err) {
        this.slogErrorAndAbort('editIr', 'SET_IR', err);
      }
      if (this.stopTesting) {
        break;
      }
    }
  }

  public async runScene() {
    this.prepare();

    for(let i = 0; i < 150; i++) {
      try {
        this.sRequest.command = {"cm":6,"sc":[{"dy":0,"id": 1,"ch":3}]};
        await this.sSocket.open(`ws://${this.tUri}/ws`, this.sMyPrivKey);
        const socket = await this.sSocket.send(this.sRequest, this.sDevPubKeyPem);
        const resp = await this.sSocket.receive(socket);
        const pResp = JSON.parse(resp).mg;

        this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      } catch (err) {
        this.slogErrorAndAbort('runScene', 'RUN_SCENE', err);
      }

      try {
        this.tRequest.command = {"cm":6,"sc":[{"dy":0,"id": 1,"ch":3}]};
        await this.tSocket.open(`ws://${this.tUri}/ws`, this.tMyPrivKey);
        const socket = await this.tSocket.send(this.tRequest, this.tDevPubKeyPem);
        const resp = await this.tSocket.receive(socket);
        const pResp = JSON.parse(resp).mg;

        this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
        this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
      } catch (err) {
        this.slogErrorAndAbort('runScene', 'RUN_SCENE', err);
      }
      if (this.stopTesting) {
        break;
      }
    }
  }

  public stopTest() {
    this.stopTesting = true;
  }

  private async eraseAllIr() {
    try {
      this.sRequest.command = {"cm": 0, "id": 0};
      await this.sSocket.open(`ws://${this.sUri}/ws`, this.sMyPrivKey);
      const socket = await this.sSocket.send(this.sRequest, this.sDevPubKeyPem);
      const resp = await this.sSocket.receive(socket);
      const pResp = JSON.parse(resp).mg;

      this.check(pResp.cm !== this.sRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.id !== this.sRequest.command.id, 'Invalid "id": ' + pResp.id);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.slogErrorAndAbort('eraseAllIr', 'ERASE_IR_ALL', err);
    }

    try {
      this.tRequest.command = {"cm": 0, "id": 0};
      await this.tSocket.open(`ws://${this.tUri}/ws`, this.tMyPrivKey);
      const socket = await this.tSocket.send(this.tRequest, this.tDevPubKeyPem);
      const resp = await this.tSocket.receive(socket);
      const pResp = JSON.parse(resp).mg;

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
      this.check(pResp.id !== this.tRequest.command.id, 'Invalid "id": ' + pResp.id);
      this.check(pResp.mg !== 'success', 'Invalid "mg": ' + pResp.mg);
    } catch (err) {
      this.tlogErrorAndAbort('eraseAllIr', 'ERASE_IR_ALL', err);
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

      await this.sSocket.open(`ws://${this.sUri}/ws`, this.sMyPrivKey);
      const socket = await this.sSocket.send(this.sRequest, this.sDevPubKeyPem);
      const resp = await this.sSocket.receive(socket);
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

      await this.tSocket.open(`ws://${this.tUri}/ws`, this.tMyPrivKey);
      const socket = await this.tSocket.send(this.tRequest, this.tDevPubKeyPem);
      const resp = await this.tSocket.receive(socket);
      const pResp = JSON.parse(resp).mg;

      this.check(pResp.cm !== this.tRequest.command.cm, 'Invalid "cm": ' + pResp.cm);
    } catch (err) {
      this.tlogErrorAndAbort('saveIr', 'SAVE_IR', err);
    }
  }

  private async prepare(editIr = false) {
    await this.eraseAllIr();
    await this.sSaveIr(1); 
    if (editIr) {
      await this.tSaveIr(1);  
    } 
  }


  private check(test, mg: string) {
    if (test)
      throw mg;
  }

  private slogErrorAndAbort(api, test, mg) {
    const date = new Date();
    const err = `[${date.toLocaleTimeString()}] [LS] (${api}) ${test}: FAIL. ${mg}\n\r.`;
    this.sError$.next(err);

    process.exit(1)
  }

  private tlogErrorAndAbort(api, test, mg) {
    const date = new Date();
    const err = `[${date.toLocaleTimeString()}] [LS] (${api}) ${test}: FAIL. ${mg}\n\r.`;
    this.tError$.next(err);

    process.exit(1)
  }
  
  public sTestFail$(): Observable<string> {
    return this.sError$.asObservable();
  }

  public tTestFail$(): Observable<string> {
    return this.tError$.asObservable();
  }
}