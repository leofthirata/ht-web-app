export function download(arr, name): Promise<void> {
  return new Promise(res => {
    const a = document.createElement("a");
    const buf = arr;
    const fileNew = new Blob([buf], {
        type: "text/plain"
    });
    a.href = URL.createObjectURL(fileNew);
    a.download = name;
    a.click();
  });
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}