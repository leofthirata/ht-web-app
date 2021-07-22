import * as forge from "node-forge";
import { str2ArrayBuffer, concatBuffers } from "./utils";

const iv_size = 32;

export async function encrypt(msg: Uint8Array, key: Uint8Array) {
  const importedKey = await window.crypto.subtle.importKey(
    "raw", 
    key,
    {   //this is the algorithm options
      name: "AES-CBC",
    },
    false, //whether the key is extractable (i.e. can be used in exportKey)
    ["encrypt", "decrypt"] //can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(16));

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-CBC",
      iv,
    },
    importedKey, 
    msg
  );

  var data = new Uint8Array(iv.byteLength + encrypted.byteLength);
  data.set(iv);
  data.set(new Uint8Array(encrypted), iv.byteLength);

  return { 
    "package": data,
    "iv": iv,
    "enc": encrypted
  };
}

// export function decrypt(msg, key: CryptoJS.lib.WordArray) {
//   var iv = CryptoJS.enc.Hex.parse(msg.toString('hex').substring(0, iv_size));
//   var encrypted = CryptoJS.enc.Hex.parse(msg.toString('hex').substring(iv_size)).toString(CryptoJS.enc.Base64);

//   var decrypted = CryptoJS.AES.decrypt(encrypted, key, { 
//     iv: iv, 
//     mode: CryptoJS.mode.CBC,
//     padding: CryptoJS.pad.Pkcs7
//   });

//   return decrypted.toString(CryptoJS.enc.Hex);
// }

// export function generateKeyRSA(size: number) {
//   var rsa = forge.pki.rsa;

//   return rsa.generateKeyPair({bits: size, workers: 2});
// }

// export function importPubKeyRSA(key: string) {
//   return forge.pki.publicKeyFromPem(key);
// }

// export function importPrivKeyRSA(key: string) {
//   return forge.pki.privateKeyFromPem(key);
// }

// export function getPublicKey(key) {
//   return key.publicKey;
// }

// export function getPrivateKey(key) {
//   return key.privateKey;
// }

// export function encryptRSA(msg: string, key): forge.Base64 {
//   return forge.util.encode64(key.encrypt(msg));
// }

// export function decryptRSA(enc: string, key): forge.Utf8 {
//   return forge.util.encodeUtf8(key.decrypt(enc));
// }

// export function printPubKeyRSA(key) {
//   console.log(forge.pki.publicKeyToPem(key));
// }

// export function printPrivKeyRSA(key) {
//   console.log(forge.pki.privateKeyToPem(key));
// }

// export function test() {
//   // var key = generateKeyRSA(1024);
//   // var pub = getPublicKey(key);
//   // var priv = getPrivateKey(key);

//   // console.log(forge.pki.publicKeyToPem(pub));
//   // console.log(forge.pki.privateKeyToPem(priv));

//   // var encrypted = encryptRSA("hausenn", pub);
//   // console.log("encrypted:", forge.util.encode64(encrypted));
//   // var decrypted = priv.decrypt(encrypted);
//   // console.log("decrypted:", decrypted);
  
//   // encrypted = encryptRSA("xablau", priv);
//   // console.log("encrypted:", forge.util.encode64(encrypted));

//   // decrypted = priv.decrypt(encrypted);
//   // console.log("decrypted:", decrypted);

//   let newKey = `-----BEGIN PUBLIC KEY-----
//   MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDqYfGcHnUguCljDyguS8LjbXJ 
//   jidGkvMYUhipEF9a7fSjbqxZ40hKqFitXIxpgsL94rUcWeBM3BTQ7+g233t2lYLW 
//   Mh6FYaf7+qu7xcE7Upni449ngFzl/vtQsTQU30FZ12iOHh9tPramopRV0IkKnpbO 
//   FuDT7TD+R3wmiRqppwIDAQAB
//   -----END PUBLIC KEY-----`;

//   var key = importPubKeyRSA(newKey);
//   var encrypted = encryptRSA("hausenn", key);
//   console.log("encrypted:", forge.util.encode64(encrypted));
// }

// // test();