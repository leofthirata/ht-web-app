// import { NgModule } from '@angular/core';
// import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

// const routes: Routes = [
//   {
//     path: 'home',
//     loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
//   },
//   {
//     path: '',
//     redirectTo: 'home',
//     pathMatch: 'full'
//   },
// ];

// @NgModule({
//   imports: [
//     RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
//   ],
//   exports: [RouterModule]
// })
// export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

const routes: Routes = [
  { path: '', redirectTo: 'tests', pathMatch: 'full' },
  // { 
  //   path: 'home', 
  //   loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  // },
  {
    path: 'bluetooth',
    loadChildren: () => import('./pages/bluetooth/bluetooth.module').then( m => m.BluetoothPageModule)
  },
  {
    path: 'serial',
    loadChildren: () => import('./pages/serial/serial.module').then( m => m.SerialPageModule)
  },
  {
    path: 'coredump',
    loadChildren: () => import('./pages/coredump/coredump.module').then( m => m.CoredumpPageModule)
  },
  {
    path: 'backend-info',
    loadChildren: () => import('./pages/backend-info/backend-info.module').then( m => m.BackendInfoPageModule)
  },
  {
    path: 'tests',
    loadChildren: () => import('./pages/tests/tests.module').then( m => m.TestsPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
    CommonModule,
    IonicModule
  ],
  exports: [RouterModule]
})

export class AppRoutingModule { }