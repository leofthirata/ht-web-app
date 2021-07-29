import { Component, OnInit } from '@angular/core';
import { DeviceState, WebSocketService } from '../home/services/websocket/ws';
import { uint8ArrayToHexString } from '../home/utils/utils';
import * as forge from "node-forge";
import { printPubKeyRSA, importPubKeyRSA } from '../home/utils/encrypt';
import { getAccessToken, sync, createPlace, createEnvironment, createDevice } from '../home/services/backend/backend'
import { Router } from '@angular/router';

@Component({
  selector: 'app-testing',
  templateUrl: './testing.page.html',
  styleUrls: ['./testing.page.scss'],
})
export class TestingPage implements OnInit {
  private m_token;
  private m_myPubKey; 
  private m_myPrivKey;
  private m_devicePublicKey;
  private m_ip;

  constructor(public router: Router) {
    if (router.getCurrentNavigation().extras.state) {
      this.m_token = this.router.getCurrentNavigation().extras.state.token;
      this.m_myPubKey = this.router.getCurrentNavigation().extras.state.myPubKey;
      this.m_myPrivKey = this.router.getCurrentNavigation().extras.state.myPrivKey;
      this.m_devicePublicKey = this.router.getCurrentNavigation().extras.state.devicePubKey;
      this.m_ip = this.router.getCurrentNavigation().extras.state.ip;
      console.log(this.m_token); 
      console.log(this.m_myPubKey); 
      console.log(this.m_myPrivKey); 
      console.log(this.m_devicePublicKey); 
    }
  }

  ngOnInit() {

  }

  public async localTests() {
    let request: any = { 
      'token': this.m_token,
      'key': this.m_myPubKey,
    };
    
    request.command = {"cm": 3};
    const socket = new WebSocketService(DeviceState.SEND_CMD);
    const onOpen = await socket.open(`ws://${this.m_ip}/ws`, this.m_myPrivKey);
    const onSend = await socket.send(request, this.m_devicePublicKey);
    const resp = await socket.receive();
    console.log(resp);
    // const success = JSON.parse(resp).mg;
    // if (success == 'fail') {
    //   throw 'SECRET_FAIL';
    // }
  }
}