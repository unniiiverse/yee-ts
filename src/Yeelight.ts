import { IYeeDevice } from './interfaces';
import { Discovery } from './Discovery';
import { Storage } from './Storage';
import { Device, IDeviceParams } from './Device';

export class Yeelight {
  private discovery = new Discovery();
  private storage = new Storage();

  async discover(timeout = 5000): Promise<IYeeDevice[] | null> {
    return new Promise((resolve, reject) => {
      this.discovery.discover();

      this.discovery.on('message', (msg: Buffer) => {
        resolve(this.storage.parseBuffer(msg));
      });

      this.discovery.on('error', e => {
        reject(e);
      });

      setTimeout(() => {
        resolve(this.storage.getAll());
      }, timeout);
    });
  }

  getDevice(id: string): IYeeDevice | null {
    return this.storage.getOne(id);
  }

  getDevices(): IYeeDevice[] | null {
    return this.storage.getAll();
  }

  createDevice(id: string, storage?: Storage, params?: IDeviceParams): Device {
    return new Device(id, storage || this.storage, params);
  }
}

export default Yeelight;