/* eslint-disable @typescript-eslint/no-explicit-any */

import Storage from './Storage.js';
import { IYeeDevice, TYeeDeviceProps } from './interfaces.js';
import net from 'net';

interface ISendCommandProps {
  timeout?: 1500
}

export class Device {
  private id: string;
  private device: IYeeDevice;
  private storage: Storage;

  constructor(id: string, storage: Storage) {
    this.storage = storage;
    this.id = id;

    const device = this.storage.getOne(id);
    if (!device) {
      throw new TypeError(`Device with id ${id} is not found.`);
    }

    this.device = device;
  }

  getDevice(): IYeeDevice {
    return this.device;
  }

  async getProp(prop: TYeeDeviceProps[], useLocal?: boolean, props?: ISendCommandProps) {
    return useLocal ? this.device[prop[0]] : await this._sendCommand({ method: 'get_prop', params: prop }, props);
  }

  async setRgb(r: number, g: number, b: number, params?: any[], props?: ISendCommandProps) {
    const rgb = (r * 65536) + (g * 256) + b;

    params = params || [];
    params.unshift(rgb);
    this.device.rgb = rgb;

    return await this._sendCommand({ method: 'set_rgb', params }, props);
  }

  // hsv

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

  async toggle(params?: any[], props?: ISendCommandProps) {
    params = params || [];
    if (this.device.power === true) {
      this.device.power = false;
    } else if (this.device.power === false) {
      this.device.power = true;
    } else {
      console.log('[yee-ts]: power mode for toggle is not provided.');
    }

    return await this._sendCommand({ method: 'toggle', params }, props);
  }

  async setBrightness(brightness: number, params?: any[], props?: ISendCommandProps) {
    params = params || [];
    params?.unshift(brightness);
    this.device.bright = brightness;

    return await this._sendCommand({ method: 'set_bright', params }, props);
  }

  private async _sendCommand(command: { method: string, params: any }, props?: ISendCommandProps): Promise<void> {
    return new Promise((resolve, reject) => {
      // const uid = +String(Math.random() * 100).replace('.', '');
      const json = JSON.stringify({ id: 2, ...command });

      const socket = new net.Socket();
      const resolveSocket = new net.Socket();
      const defaultTimeout = 5000;
      const timeout = props?.timeout || defaultTimeout;

      socket.connect({
        port: this.device.port || 55443,
        host: this.device.ip
      });

      resolveSocket.connect({
        port: this.device.port || 55443,
        host: this.device.ip
      });

      socket.setTimeout(timeout);

      socket.on('ready', () => {
        socket.write(`${json}\r\n`, () => {
          console.log('[yee-ts]: writed');
          socket.destroy();
          resolve();
        });
      });

      socket.on('data', data => {
        console.log(data.toString());
      });

      socket.on('error', reject);
      socket.on('timeout', () => { console.error(`[yee-ts]: Socket timeouted ${timeout}ms.`); reject(`[yee-ts]: Socket timeouted ${timeout}ms.`); });
    });
  }
}

export default Device;