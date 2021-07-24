import { WifiAuthMode } from "./wifi-auth-modes.enum";
import { WifiCipherType } from "./wifi-cipher-types.enum";

export interface WifiScanResponse {
  current: number;
  total: number;
  ssid: string;
  auth: WifiAuthMode;
  cipher: WifiCipherType;
  rssi: number;
}

export interface WifiConnResponse {
  ip: string;
  uuid: string;
  mac: string;
  registered: boolean;
}

export interface WifiDoneResponse {

}