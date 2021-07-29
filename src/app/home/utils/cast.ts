export class Cast {
  /*************************************************************************************************
   * String
   ************************************************************************************************/
  public static stringToBytes(val: string): Uint8Array {
    const buffer = new Uint8Array(val.length);

    for (let i = 0; i < val.length; i++) {
      buffer[i] = val.charCodeAt(i);
    }

    return buffer;
  }

  public static bytesToString(val: Uint8Array): string {
    const buffer: string[] = [];

    for (const byte of val) {
      buffer.push(String.fromCharCode(byte));
    }

    return buffer.join('');
  }

  public static bytesToHex(val: Uint8Array): string {
    return val
      .reduce((str, value) => str + value.toString(16).padStart(2, '0'), '')
      .toUpperCase();
  }

  public static hexToBytes(val: string): Uint8Array {
    return new Uint8Array(
      val.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );
  }
}
