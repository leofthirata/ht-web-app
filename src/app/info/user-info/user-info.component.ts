import { Component, OnInit } from '@angular/core';
import { PopoverController, } from '@ionic/angular';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss'],
})
export class UserInfoComponent implements OnInit {
  user;

  public pubKey;
  public privKey;
  public ticket

  constructor(
    private popoverController: PopoverController) { }

  ngOnInit() {
    this.ticket = this.user.ticket;
    this.pubKey = this.user.pubKey;
    this.privKey = this.user.privKey;
  }

  dismiss() {
    // code for setting wifi option in apps
    this.popoverController.dismiss();
  }

  eventFromPopover() {
    this.popoverController.dismiss();
  }
}
