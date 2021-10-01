import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// import Keycloak from 'keycloak-js';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {
  // private keycloak;

  // constructor() { 
  //   this.keycloak = Keycloak({
  //     url: "https://pado.hausenn.com.br/auth/",
  //     realm: "hausenn",
  //     clientId: 'pado-client-app'
  //   });

  //   this.keycloak.init({ onLoad: 'login-required' }).then(authenticated => {
  //       console.log(authenticated);
  //   });

  //   console.log('aaaaaaaaaaaaaaaaaaa');
  // }

  // ngOnInit() {
  // }

  // public logoutOnClick() {
  //   this.keycloak.logout();
  //   console.log('bbbbbbbbbbbbbbbbbbb');
  // }
}
