import { DeviceState, WebSocketService } from "../home/services/websocket/ws";
import { Terminal } from "xterm";

export class LocalTestingService {
  private m_request: any;
  private myPubKeyPem: any;
  private myPrivKey: any;
  private devicePubKeyPem: any;
  private deviceToken: any;
  private uri: string;
  private term: Terminal;

  constructor(uri:string, myPubKeyPem, myPrivKey, devicePubKeyPem, deviceToken, term) {
    this.myPubKeyPem = myPubKeyPem;
    this.myPrivKey = myPrivKey;
    this.devicePubKeyPem = devicePubKeyPem;
    this.deviceToken = deviceToken;
    this.uri = uri;
    this.term = term;

    this.m_request = { "token": this.deviceToken, "key": this.myPubKeyPem };
  }

   // TESTS
  public GET_INFO(): Promise<string> {
    return new Promise(async res => {
      this.m_request.command = {"cm": 3};

      const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
      const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
      const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
      const resp = await socket.receive();
      const success = JSON.parse(resp).mg;
      if (success == 'fail') {
        throw 'GET_INFO FAIL';
      }
  
      res(resp);
    });
  }
  
  public async ERASE_IR() {
    this.m_request.command = {"cm": 0, "id": 1};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'ERASE_IR FAIL';
    }
  }
  
  public async GET_IR() {
    this.m_request.command = {"cm": 1};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'GET_IR FAIL';
    }
  }

  public async SET_IR() {
    this.m_request.command = {"cm": 2, "id": 1, "ch": 3};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'SET_IR FAIL';
    }
  }

  public async CANCEL_IR() {
    this.m_request.command = {"cm": 4};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'CANCEL_IR FAIL';
    }
  }

  public async EDIT_IR() {
    this.m_request.command = {"cm": 5, "id": 1};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'EDIT_IR FAIL';
    }
  }

  public async RUN_SCENE() {
    this.m_request.command = {"cm": 6, "sc":[{"dy":1,"id": 1,"ch":3}]};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'RUN_SCENE FAIL';
    }
  }

  public async FAC_RESET() {
    this.m_request.command = {"cm": 11};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'FAC_RESET FAIL';
    }
  }

  public async GET_HEAP() {
    this.m_request.command = {"cm": 13};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'GET_HEAP FAIL';
    }
  }

  public async RESET() {
    this.m_request.command = {"cm": 14};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'RESET FAIL';
    }
  }

  public async BLE_ON() {
    this.m_request.command = {"cm": 15};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'BLE_ON FAIL';
    }
  }

  public async BLE_OFF() {
    this.m_request.command = {"cm": 16};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'BLE_OFF FAIL';
    }
  }

  public async FIND_ME() {
    this.m_request.command = {"cm": 17};
    const socket = new WebSocketService(DeviceState.SEND_CMD, this.term);
    const onOpen = await socket.open(`ws://${this.uri}/ws`, this.myPrivKey);
    const onSend = await socket.send(this.m_request, this.devicePubKeyPem);
    const resp = await socket.receive();
    console.log(resp);
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'FIND_ME FAIL';
    }
  }
}