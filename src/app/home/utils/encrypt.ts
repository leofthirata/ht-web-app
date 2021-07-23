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

export function generateKeyRSA(size: number) {
  const rsa = forge.pki.rsa;

  return rsa.generateKeyPair({bits: size, workers: 2});
}

export function importPubKeyRSA(key: string) {
  return forge.pki.publicKeyFromPem(key);
}

export function importPrivKeyRSA(key: string) {
  return forge.pki.privateKeyFromPem(key);
}

export function getPublicKey(key) {
  return key.publicKey;
}

export function getPrivateKey(key) {
  return key.privateKey;
}

export function encryptRSA(msg: string, key): forge.Base64 {
  return key.encrypt(msg);
}

export function decryptRSA(enc, key): forge.Utf8 {
  return forge.util.encodeUtf8(key.decrypt(enc));
}

export function printPubKeyRSA(key) {
  console.log(forge.pki.publicKeyToPem(key));
}

export function printPrivKeyRSA(key) {
  console.log(forge.pki.privateKeyToPem(key));
}