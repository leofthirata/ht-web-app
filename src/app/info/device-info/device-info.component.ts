import { Component, OnInit } from '@angular/core';
import { PopoverController, } from '@ionic/angular';

@Component({
  selector: 'app-device-info',
  templateUrl: './device-info.component.html',
  styleUrls: ['./device-info.component.scss'],
})
export class DeviceInfoComponent implements OnInit {
  device;

  public ip;
  public uuid;
  public ticket;
  public key;

  constructor(
    private popoverController: PopoverController) { }

  ngOnInit() {
    console.log(this.device);
    this.uuid = this.device.uuid;
    this.ticket = this.device.ticket;
    this.ip = this.device.ip;
    this.key = this.device.key;
  }

  dismiss() {
    // code for setting wifi option in apps
    this.popoverController.dismiss();
  }

  eventFromPopover() {
    this.popoverController.dismiss();
  }
}

