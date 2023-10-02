import { IYeeDevice } from './interfaces.js';
import { Discovery } from './Discovery.js';


export class Yeelight {
  private discovery = new Discovery();

  constructor() {
    //
  }

  async discover(timeout = 2000): Promise<IYeeDevice[] | null> {
    return new Promise((resolve, reject) => {
      this.discovery.discover();

      this.discovery.on('message', (msg: Buffer) => {
        console.log(msg.toString());
        resolve(null);
      });

      this.discovery.on('error', e => {
        reject(e);
      });

      setTimeout(() => {
        resolve(null);
      }, timeout);
    });
  }
}

export default Yeelight;