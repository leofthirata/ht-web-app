import { Cast } from './cast';
import * as Colors from './color';
import { Terminal } from 'xterm';

export class Log {
  public static logError(error: any, term: Terminal) {
    let text: string;

    if (typeof error === 'string') {
      text = error;
    } else if (error?.message) {
      text = error.message;
    } else {
      text = 'Unknown error';
    }

    term.writeln(Colors.red + '[ERROR] ' + text);
  }

  public static white(text: string, term: Terminal) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    term.write(Colors.white);
    term.write(utf8);
    term.write('\r\n');
  }

  public static blue(text: string, term: Terminal) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    term.write(Colors.blue);
    term.write(utf8);
    term.write('\r\n');
  }

  public static red(text: string, term: Terminal) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    term.write(Colors.red);
    term.write(utf8);
    term.write('\r\n');
  }

  public static green(text: string, term: Terminal) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    term.write(Colors.green);
    term.write(utf8);
    term.write('\r\n');
  }

  public static yellow(text: string, term: Terminal) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    term.write(Colors.yellow);
    term.write(utf8);
    term.write('\r\n');
  }

  public static cyan(text: string, term: Terminal) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    term.write(Colors.cyan);
    term.write(utf8);
  }

  public static magenta(text: string, term: Terminal) {
    text = text.replace(/\n/g, '\r\n');
    const utf8 = Cast.stringToBytes(text);
    term.write(Colors.magenta);
    term.write(utf8);
  }
}
