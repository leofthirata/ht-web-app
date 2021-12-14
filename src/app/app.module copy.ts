import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy, PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { UserInfoComponent } from './info/user-info/user-info.component'
import { DeviceInfoComponent } from './info/device-info/device-info.component'

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { 
    path: 'home', 
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  // {
  //   path: 'bluetooth',
  //   loadChildren: () => import('./pages/bluetooth/bluetooth.module').then( m => m.BluetoothPageModule)
  // },
  // {
  //   path: 'serial',
  //   loadChildren: () => import('./pages/serial/serial.module').then( m => m.SerialPageModule)
  // },
  // {
  //   path: 'coredump',
  //   loadChildren: () => import('./pages/coredump/coredump.module').then( m => m.CoredumpPageModule)
  // },
  // {
  //   path: 'backend-info',
  //   loadChildren: () => import('./pages/backend-info/backend-info.module').then( m => m.BackendInfoPageModule)
  // },
  // {
  //   path: 'tests',
  //   loadChildren: () => import('./pages/tests/tests.module').then( m => m.TestsPageModule)
  // },
];

@NgModule({
  declarations: [AppComponent, DeviceInfoComponent, UserInfoComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, useHash: true }),
    CommonModule,
    IonicModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
  exports: [RouterModule]
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
