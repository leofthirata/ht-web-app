import { Component, OnInit } from '@angular/core';
import { AuthService } from '../home/services/auth/auth';
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
  private m_auth: AuthService;
  private m_devicePublicKey;
  private m_ip;
  private m_state = DeviceState.GET_KEY;
  private m_secret: string;
  private m_deviceTicket: string;
  private m_deviceUuid: string;
  public gotKey = false;
  public secretSet = false;
  public ticketSet = false;
  public deviceRegistered = false;

  constructor(public router: Router){
    if (router.getCurrentNavigation().extras.state) {
      this.m_ip = this.router.getCurrentNavigation().extras.state;
      console.log(this.m_ip); 
    }
  }

  ngOnInit() {
    this.m_auth = new AuthService();
  }

  public async getKey() {
    this.gotKey = true;

    let request = {
      "key": forge.pki.publicKeyToPem(this.m_auth.getPubKey())
    };

    const socket = new WebSocketService(this.m_state);
    const onOpen = await socket.open(`ws://${this.m_ip}/get_key`, this.m_auth.getPrivKey());
    const onSend = await socket.send(request);
    const resp = await socket.receive();
    console.log(resp);

    this.m_devicePublicKey = importPubKeyRSA(JSON.parse(resp).key);

    printPubKeyRSA(this.m_devicePublicKey);

    this.m_state = DeviceState.SEND_CMD;
    this.gotKey = true;
  }

  public async setSecret() {
    this.m_secret = uint8ArrayToHexString(window.crypto.getRandomValues(new Uint8Array(16)));
    let secretRequest = { 
      'secret': this.m_secret,
      'key': forge.pki.publicKeyToPem(this.m_auth.getPubKey())
    };
    
    const socket = new WebSocketService(this.m_state);
    const onOpen = await socket.open(`ws://${this.m_ip}/set_secret`, this.m_auth.getPrivKey());
    const onSend = await socket.send(secretRequest, this.m_devicePublicKey);
    const resp = await socket.receive();
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'SECRET_FAIL';
    }
    this.secretSet = true;
  }

  public async registerDevice() {
    const refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIwZDU4YmIzYy1hNzZjLTQwYzEtYjA4ZS01MjJkOGQwMmE1ZjUifQ.eyJqdGkiOiJiZmI4ZTA1MC0zMGE0LTQyMmItOTc5Ni0xMzEzMzQ3YjRjMTUiLCJleHAiOjAsIm5iZiI6MCwiaWF0IjoxNjI1NzQ4MDkwLCJpc3MiOiJodHRwczovL3N0YWdlLnBhZG90ZWMuY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJhdWQiOiJodHRwczovL3N0YWdlLnBhZG90ZWMuY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJzdWIiOiJkZTFjMmIyMy1hNGM0LTRiYzQtYjQ2Ni0zNTM4OTVmNTgxOTAiLCJ0eXAiOiJPZmZsaW5lIiwiYXpwIjoiaGF1c2Vubi1jbGllbnQtYXBwIiwiYXV0aF90aW1lIjowLCJzZXNzaW9uX3N0YXRlIjoiMTM5MzAyZjgtZDBhZC00ZjFjLWJlOWQtOTRlYjdkMGNhNTJmIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBvZmZsaW5lX2FjY2VzcyBlbWFpbCBwcm9maWxlIn0.TqvywFzLXqEYZHCi1w4EAwFNQPfGPyfA14IJ5Bu_bac';
    const accessToken = await getAccessToken(refreshToken);
    const user = await sync(accessToken);
    const place = await createPlace(accessToken, 'Local1', 'Address1');
    const env = await createEnvironment(accessToken, place, 'Environment1');
    const dev = await createDevice(this.m_secret, accessToken, env, 'Device1', this.m_ip, '123123', '321321', 'PADOTEC', 'one', forge.pki.publicKeyToPem(this.m_devicePublicKey));
    // this.m_deviceTicket = dev.ticket;
    // this.m_deviceUuid = dev.uuid;
    console.log(dev);
    this.deviceRegistered = true;
  }

  public async setTicket() {
    let ticketRequest = { 
      'ticket': this.m_deviceTicket,
      'uuid': this.m_deviceUuid,
      'key': forge.pki.publicKeyToPem(this.m_auth.getPubKey())
    };
    
    const socket = new WebSocketService(this.m_state);
    const onOpen = await socket.open(`ws://${this.m_ip}/set_ticket`, this.m_auth.getPrivKey());
    const onSend = await socket.send(ticketRequest, this.m_devicePublicKey);
    const resp = await socket.receive();
    const success = JSON.parse(resp).mg;
    if (success == 'fail') {
      throw 'TICKET_FAIL';
    }
    this.ticketSet = true;
  }

}