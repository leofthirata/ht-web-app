import * as api from 'node-fetch';
import { pem } from 'node-forge';

// old staging
// const backend = `http://stage.hausenn.com.br/devices-service`;
// const refreshTokenRoute = `https://stage.padotec.com.br/auth/realms/hausenn/protocol/openid-connect/token`;

// new staging
// const backend = `http://stage.padotec.com.br:8011/devices-service/v1`;
// const refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIwZDU4YmIzYy1hNzZjLTQwYzEtYjA4ZS01MjJkOGQwMmE1ZjUifQ.eyJqdGkiOiJiZmI4ZTA1MC0zMGE0LTQyMmItOTc5Ni0xMzEzMzQ3YjRjMTUiLCJleHAiOjAsIm5iZiI6MCwiaWF0IjoxNjI1NzQ4MDkwLCJpc3MiOiJodHRwczovL3N0YWdlLnBhZG90ZWMuY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJhdWQiOiJodHRwczovL3N0YWdlLnBhZG90ZWMuY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJzdWIiOiJkZTFjMmIyMy1hNGM0LTRiYzQtYjQ2Ni0zNTM4OTVmNTgxOTAiLCJ0eXAiOiJPZmZsaW5lIiwiYXpwIjoiaGF1c2Vubi1jbGllbnQtYXBwIiwiYXV0aF90aW1lIjowLCJzZXNzaW9uX3N0YXRlIjoiMTM5MzAyZjgtZDBhZC00ZjFjLWJlOWQtOTRlYjdkMGNhNTJmIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBvZmZsaW5lX2FjY2VzcyBlbWFpbCBwcm9maWxlIn0.TqvywFzLXqEYZHCi1w4EAwFNQPfGPyfA14IJ5Bu_bac";
// const refreshTokenRoute = `https://stage.padotec.com.br/auth/realms/hausenn/protocol/openid-connect/token`;

// production
const backend = `https://cloud1.hausenn.com.br/devices-service/v1`;
const refreshTokenRoute = `https://auth.hausenn.com.br/auth/realms/hausenn/protocol/openid-connect/token`;
const refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI2NTZkZTY4Yi1mMGVjLTQzOTEtODk4Yi0xMjliNWRhYWExYjkifQ.eyJpYXQiOjE2Mjc1NzM5MzYsImp0aSI6IjM3ZjQ3Y2E3LWI0NDUtNGE5My1hMzFlLTA5YWY1ZjgzNWEyMiIsImlzcyI6Imh0dHBzOi8vYXV0aC5oYXVzZW5uLmNvbS5ici9hdXRoL3JlYWxtcy9oYXVzZW5uIiwiYXVkIjoiaHR0cHM6Ly9hdXRoLmhhdXNlbm4uY29tLmJyL2F1dGgvcmVhbG1zL2hhdXNlbm4iLCJzdWIiOiJjOGY2NzkxMy0zNGJjLTRmNDQtYTNjZC00OTEzNjY1NzBkMjYiLCJ0eXAiOiJPZmZsaW5lIiwiYXpwIjoiaGF1c2Vubi1jbGllbnQtYXBwIiwic2Vzc2lvbl9zdGF0ZSI6IjlhN2ZlODAyLWQxYzItNGMwYy1hN2YyLTdkNzk0NzQ5YWU2MSIsInNjb3BlIjoib3BlbmlkIG9mZmxpbmVfYWNjZXNzIGVtYWlsIHByb2ZpbGUifQ.sl2jtOIjbUN7smaxw_Nf3FquPKCtAp9BjKQXtutBfD4";

// const refreshTokenRoute = `https://cloud1.hausenn.com.br/auth/realms/hausenn/protocol/openid-connect/token`;

const key = '02E596CDAB2D81320A94BFD6D52BAFAE';

export async function getAccessToken(rToken: string): Promise<string> {
  let res = await fetch(`${refreshTokenRoute}`, {
                        method: 'post',
                        body: `client_id=hausenn-client-app&grant_type=refresh_token&refresh_token=${rToken}`,
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                      });
  const jRes = await res.json(); 

  return jRes.access_token;
}

export async function sync(aToken: string): Promise<Object> {
  let res = await fetch(`${backend}/sync`, {
                        method: 'get',
                        headers: {
                          'Authorization': `Bearer ${aToken}`
                        }
  });
  const jRes = await res.json(); 

  return {
    'uuid': jRes.user_profile[0].uuid,
    'ticket': jRes.user_profile[0].ticket
  };
}

export async function createPlace(aToken: string, name: string, address: string): Promise<any> {
  let res = await fetch(`${backend}/places`, {
                        method: 'post',
                        headers: {
                          'Authorization': `Bearer ${aToken}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          "address": address,
                          "name": name
                        })
  });

  const jRes = await res.json(); 

  return jRes.idPlace;
}

export async function createEnvironment(aToken: string, id: string, name: string): Promise<any> {
  let res = await fetch(`${backend}/environments`, {
                        method: 'post',
                        headers: {
                          'Authorization': `Bearer ${aToken}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          "id_place": id,
                          "name_env": name
                        })
  });

  const jRes = await res.json(); 

  return jRes.id_env;
}

export async function createDevice(
  secret: string, 
  aToken: string, 
  eId: string, 
  name: string, 
  ip: string, 
  staMac: string, 
  bleMac: string, 
  ssid: string, 
  type: string, 
  publicKey): Promise<Object> {

  let res = await fetch(`${backend}/devices`, {
                        method: 'post',
                        headers: {
                          'Authorization': `Bearer ${aToken}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          "ble_key": key,
                          "ble_mac": bleMac,
                          "channel": 3,
                          "id_env": eId,
                          "ip": ip,
                          "latitude": "null",
                          "longitude": "null",
                          "mac": staMac,
                          "public_key": publicKey,
                          "name_device": name,
                          "secret": secret,
                          "ssid": ssid,
                          "type": type
                          })
  });

  const jRes = await res.json(); 

  // return jRes;
  // console.log(jRes);

  // return {
  //   'ticket': jRes.device_ticket,
  //   'uuid': jRes.idDevice
  // };

  return [jRes.device_ticket, jRes.idDevice];
}

async function test() {
  let accessToken = await getAccessToken(refreshToken);

  // let user = await sync(accessToken);

  // let place = await createPlace(accessToken, 'teste1', 'teste2');

  // let env = await createEnvironment(accessToken, place.idPlace, 'teste3');

  // let dev = await createDevice(accessToken, env.id_env, 'onezao');

  // let remoteWS = {
  //   'macToken': dev.macToken,
  //   'sender': user.uuid,
  //   'recipient': dev.idDevice,
  //   'device_ticket': dev.device_ticket,
  //   'user_ticket': user.ticket
  // }

  // console.log(remoteWS);

  // deletePlaces(accessToken);
}

// test();