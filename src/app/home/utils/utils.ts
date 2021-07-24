export function str2arr(str: string): Uint8Array {
  console.log(str);
  let arr = new Uint8Array(str.length/2);

  for(let i = 0; i < str.length/2; i++) {
    arr[i] = parseInt((str.substring(i*2, i*2 + 2)), 16);
  }

  return arr;
}

export function ascii2hex(str: String): String {
  var arr1 = [];
  for (var n = 0, l = str.length; n < l; n ++) {
    var hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join('');
}

export function hex2ascii(hexx) {
  var hex = hexx.toString();
  var str = '';
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str.substring(2);
}

export function arr2str(arr: Uint8Array): String {
  let res = "";

  for(let i = 0; i < arr.length; i++) {
    if (arr[i] < 0x10) {
      res += "0" + arr[i].toString(16);
    }
    else {
      res += arr[i].toString(16);
    }
  }

  return res;
}

export function pack(...args): String {
  return args.reduce((a, b) => a + b);
}

// export function split(package: String):  {
//   let arr = [];

//   for(let i = 0; (i*data_size) < package.length; data_size*(i++)) {
//     arr[i] = package.substring(i*data_size, (i+1)*data_size);
//   }

//   return arr;
// }

export function str2ArrayBuffer(str: String): ArrayBuffer {
  var buf = new ArrayBuffer(str.length/2);
  var bufView = new Uint8Array(buf);

  for (var i=0; i < str.length/2; i++) {
    bufView[i] = parseInt(str.substring(i * 2, (i + 1)*2), 16);
  }
  return buf;
}

export function concatBuffers(a, b): ArrayBuffer {
  return concatTypedArrays(
      new Uint8Array(a.buffer || a), 
      new Uint8Array(b.buffer || b)
  ).buffer;
}

function concatTypedArrays(a, b) { // a, b TypedArray of same type
  var c = new (a.constructor)(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

export function str2Uint8arr(str) {
  let arr = new Uint8Array(str.length / 2);

  for(let i = 0; i < str.length/2; i++) {
    arr[i] = parseInt((str.substring(i*2, i*2 + 2)), 16);
  }

  return arr;
}

export function uint8ArrayToHexString(val: Uint8Array): string {
  const rslt = val.reduce(
    (str, value) => str + value.toString(16).padStart(2, '0'),
    '',
  );
  return rslt.toUpperCase();
}