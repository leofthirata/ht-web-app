export enum WifiAuthMode {
  WIFI_AUTH_OPEN = 0 /**< authenticate mode : open */,
  WIFI_AUTH_WEP = 1 /**< authenticate mode : WEP */,
  WIFI_AUTH_WPA_PSK = 2 /**< authenticate mode : WPA_PSK */,
  WIFI_AUTH_WPA2_PSK = 3 /**< authenticate mode : WPA2_PSK */,
  WIFI_AUTH_WPA_WPA2_PSK = 4 /**< authenticate mode : WPA_WPA2_PSK */,
  WIFI_AUTH_WPA2_ENTERPRISE = 5 /**< authenticate mode : WPA2_ENTERPRISE */,
  WIFI_AUTH_WPA3_PSK = 6 /**< authenticate mode : WPA3_PSK */,
  WIFI_AUTH_WPA2_WPA3_PSK = 7 /**< authenticate mode : WPA2_WPA3_PSK */,
  WIFI_AUTH_MAX = 8,
}