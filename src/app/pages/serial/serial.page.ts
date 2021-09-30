/// <reference types="w3c-web-serial" />

import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

import { Cast } from '../../home/utils/cast';
import * as Colors from '../../home/utils/color';

@Component({
  selector: 'app-serial',
  templateUrl: './serial.page.html',
  styleUrls: ['./serial.page.scss'],
})

export class SerialPage implements AfterViewInit {
  @ViewChild('terminal1') terminal5: ElementRef;
  @ViewChild('terminal2') terminal6: ElementRef;

  private term = new Terminal();
  private term2 = new Terminal();

  public portConnected = false;
  public port: SerialPort;
  public serialData = '';
  public reader;

  constructor() {
    navigator.serial.addEventListener('disconnect', (event) => {
      const port = event.target as SerialPort;
      console.log('Port disconnected', port);

      if (port === this.port) {
        this.portConnected = false;
      }
      
    });
  }

  ngAfterViewInit() {
    const fitAddon1 = new FitAddon();
    this.term.loadAddon(fitAddon1);
    this.term.open(this.terminal5.nativeElement);
    fitAddon1.fit();

    const fitAddon2 = new FitAddon();
    this.term2.loadAddon(fitAddon2);
    this.term2.open(this.terminal6.nativeElement);
    fitAddon2.fit();
  }

  public async onConnectDevice() {
    this.port = await this.open();

    if (this.port) {
      this.portConnected = true;
      const date = new Date();
      const dateStr = `[${date.toLocaleTimeString()}] [SERIAL] Connected to serial port\n\r`;
      this.green(dateStr);
      this.readUntilClosed();
    }
  }

  public async onDisconnectDevice() {
    this.portConnected = false;
    await this.reader.cancel();
    await this.reader.releaseLock();
    await this.close(this.port);
  }

  private async readUntilClosed() {
    let buffer: number[] = [];
    let buffer2: number[] = [];

    this.reader = this.port.readable.getReader();

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) {
          // |reader| has been canceled.
          break;
        } else {
          buffer = Array.from(value);
          buffer2 = Array.from(value);
          const str = Cast.bytesToString(new Uint8Array(buffer));
          const str2 = Cast.bytesToHex(new Uint8Array(buffer));
          this.term.write(str);
          this.term2.write(str2);
        }
        // Do something with |value|...
      }
    } catch (error) {
      // Handle |error|...
    } finally {
      this.reader.releaseLock();
    }
  }

  private async open(): Promise<SerialPort> {
    try {
      const port = await navigator.serial.requestPort({
        filters: [{ usbProductId: 60000, usbVendorId: 4292 },
                  { usbProductId: 60001, usbVendorId: 4293 },
                  { usbProductId: 24592, usbVendorId: 1027 }]
      });

      await port.open({ baudRate: 115200, bufferSize: 4096, flowControl: 'none' });

      return port;
    } catch (error) {
      return null;
    }
  }

  private async close(port: SerialPort): Promise<void> {
    if (port) {
      await port.close();
      port = null;
    }
  }

  private async send(port: SerialPort, data: Uint8Array): Promise<void> {
    const writter = await port.writable.getWriter();

    try {
      await writter.write(data);
    } finally {
      writter.close();
    }
  }

  onSend() {
    if (this.serialData.substring(0,2) == "0x") {
      var data = Cast.hexToBytes(this.serialData.substring(2, this.serialData.length));
    } else {
      var data = Cast.hexToBytes(this.serialData);
    }
    console.log(data);
    try {
      // this.green(this.serialData);
      this.send(this.port, data);
    } catch (error) {
      // this.green(this.serialData);
    }
  }

  private green(text: string) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    this.term.write(Colors.green);
    this.term.write(utf8);
    this.term.write('\r\n');
  }
}
