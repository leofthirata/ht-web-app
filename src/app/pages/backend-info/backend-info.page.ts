import { Component, OnInit } from '@angular/core';
import * as backend from '../../services/backend/backend';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-backend-info',
  templateUrl: './backend-info.page.html',
  styleUrls: ['./backend-info.page.scss'],
})

export class BackendInfoPage implements OnInit {

  private keycloak;

  constructor() { 
    this.keycloak = Keycloak({
      url: "https://pado.hausenn.com.br/auth/",
      realm: "hausenn",
      clientId: 'pado-client-app'
    });

    this.keycloak.init({ onLoad: 'login-required' }).then(authenticated => {
        console.log(authenticated);
    })
  }

  ngOnInit() {
  }

  public logoutOnClick() {
    this.keycloak.logout();
  }
}
