export enum WifiCipherType {
  WIFI_CIPHER_TYPE_NONE = 0 /**< the cipher type is none */,
  WIFI_CIPHER_TYPE_WEP40 = 1 /**< the cipher type is WEP40 */,
  WIFI_CIPHER_TYPE_WEP104 = 2 /**< the cipher type is WEP104 */,
  WIFI_CIPHER_TYPE_TKIP = 3 /**< the cipher type is TKIP */,
  WIFI_CIPHER_TYPE_CCMP = 4 /**< the cipher type is CCMP */,
  WIFI_CIPHER_TYPE_TKIP_CCMP = 5 /**< the cipher type is TKIP and CCMP */,
  WIFI_CIPHER_TYPE_AES_CMAC128 = 6 /**< the cipher type is AES-CMAC-128 */,
  WIFI_CIPHER_TYPE_UNKNOWN = 7 /**< the cipher type is unknown */,
}