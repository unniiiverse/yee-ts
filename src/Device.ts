/* eslint-disable @typescript-eslint/no-explicit-any */

import Storage from './Storage.js';
import { IYeeDevice, TYeeDeviceProps } from './interfaces.js';
import net from 'node:net';

interface ISendCommandProps {
  timeout?: 1500
}

export class Device {
  private cmdI = 0;
  private device: IYeeDevice;
  private storage: Storage;

  constructor(id: string, storage: Storage) {
    this.storage = storage;

    const device = this.storage.getOne(id);
    if (!device) {
      throw new TypeError(`[yee-ts]: Device with id ${id} is not found.`);
    }

    this.device = device;
    this.device.id = id;

    const listenSocket = net.createConnection({
      port: 55443,
      host: this.device.ip,
      family: 4,
      noDelay: true
    });

    listenSocket.on('data', data => {
      // console.log(`[yee-ts <DEV>]: ${data.toString()}`);
    });
  }

  private async _sendCommand(command: { method: string, params: any }, props?: ISendCommandProps): Promise<void> {
    return new Promise((resolve, reject) => {
      const payload = `${JSON.stringify({ id: this.cmdI, ...command })}\r\n`;

      const defaultTimeout = 5000;
      const timeout = props?.timeout || defaultTimeout;

      const socket = new net.Socket({
        writable: true
      });

      socket.connect(55443, this.device.ip);

      socket.on('ready', () => {
        socket.write(payload, e => {
          if (e) return reject(e);

          socket.write(' ', e => {
            if (e) return reject(e);

            this.cmdI++;
            // console.log(`[yee-ts <DEV>]: writed payload ${payload}`);

            socket.destroy();
            return resolve();
          });
        });
      });

      socket.on('error', reject);
      socket.on('timeout', () => { console.error(`[yee-ts]: Socket timeouted ${timeout}ms.`); reject(`[yee-ts]: Socket timeouted ${timeout}ms.`); });
    });
  }



  getDevice(): IYeeDevice {
    return this.device;
  }

  async getProp(prop: TYeeDeviceProps) {
    return this.device[prop];
  }

  async sendCommand(command: { method: string, params: any }, props?: ISendCommandProps) {
    return await this._sendCommand(command, props);
  }

  async setRgb(r: number, g: number, b: number, params?: any[], props?: ISendCommandProps) {
    const rgb = (r * 65536) + (g * 256) + b;

    params = params || [];
    params.unshift(rgb);
    this.device.rgb = rgb;

    return await this._sendCommand({ method: 'set_rgb', params }, props);
  }

  // hsv

  async setBright(brightness: number, params?: any[], props?: ISendCommandProps) {
    params = params || [];
    params?.unshift(brightness);
    this.device.bright = brightness;

    return await this._sendCommand({ method: 'set_bright', params }, props);
  }

  async turnOn(params?: any[], props?: ISendCommandProps) {
    params = params || [];
    params?.unshift('on');
    this.device.power = true;

    return await this._sendCommand({ method: 'set_power', params }, props);
  }

  async turnOff(params?: any[], props?: ISendCommandProps) {
    params = params || [];
    params?.unshift('off');
    this.device.power = false;

    return await this._sendCommand({ method: 'set_power', params }, props);
  }

  async toggle(props?: ISendCommandProps) {
    if (this.device.power === true) {
      this.device.power = false;
    } else if (this.device.power === false) {
      this.device.power = true;
    } else {
      console.log('[yee-ts]: power mode for toggle is not provided.');
    }

    return await this._sendCommand({ method: 'toggle', params: [] }, props);
  }

  async setDefaults(props?: ISendCommandProps) {
    return await this._sendCommand({ method: 'set_default', params: [] }, props);
  }
}

export default Device;