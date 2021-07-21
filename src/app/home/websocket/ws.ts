export class WebSocketService {
  private m_ws: WebSocket;
  private m_uri: string;

  constructor() {

  }

  public open(uri: string): Promise<boolean> {
      this.m_uri = uri;
      return new Promise(resolve => {
          this.m_ws = new WebSocket(uri);

          this.m_ws.onopen = event => {
              console.log('open:' + event);
              resolve(true);
          };
  
          this.m_ws.onerror = error => {
              console.log('error:' + error);
              resolve(false);
          }
      });
  }

  public send(data: string): Promise<boolean> {
      return new Promise(resolve => {
          this.m_ws.send(data);
          resolve(true);
      })
  }

  public ble() {
      const connectToDeviceAndSubscribeToUpdates = async () => {
          const device = await navigator.bluetooth
             .requestDevice({
                  acceptAllDevices: true
             });
          console.log(device);
       };
       connectToDeviceAndSubscribeToUpdates();
  }
}