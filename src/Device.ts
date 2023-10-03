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

  getProp(prop: TYeeDeviceProps) {
    return this.device[prop];
  }

  async toggle(params?: any[], props?: ISendCommandProps) {
    params = params || [];
    return await this._sendCommand({ method: 'toggle', params }, props);
  }

  async turnOn(params?: any[], props?: ISendCommandProps) {
    params = params || [];
    params?.unshift('on');
    return await this._sendCommand({ method: 'set_power', params }, props);
  }

  async turnOff(params?: any[], props?: ISendCommandProps) {
    params = params || [];
    params?.unshift('off');
    return await this._sendCommand({ method: 'set_power', params }, props);
  }

  async setBrightness(brightness: number, params?: any[], props?: ISendCommandProps) {
    params = params || [];
    params?.unshift(brightness);
    return await this._sendCommand({ method: 'set_bright', params }, props);
  }

  private async _sendCommand(command: { method: string, params: any }, props?: ISendCommandProps): Promise<void> {
    return new Promise((resolve, reject) => {
      // const uid = +String(Math.random() * 100).replace('.', '');
      const json = JSON.stringify({ id: 2, ...command });

      console.log(json);
      const socket = new net.Socket();
      const resolveSocket = new net.Socket();
      const defaultTimeout = 5000;
      const timeout = props?.timeout || defaultTimeout;

      socket.connect({
        port: this.device.port,
        host: this.device.ip
      });

      resolveSocket.connect({
        port: this.device.port,
        host: this.device.ip
      });

      socket.setTimeout(timeout);

      socket.on('ready', () => {
        socket.write(`${json}\r\n`, () => {
          console.log('writed');
          socket.destroy();
          resolve();
        });
      });

      socket.on('error', reject);
      socket.on('timeout', () => { console.error(`[yee-ts]: Socket timeouted ${timeout}ms.`); reject(`[yee-ts]: Socket timeouted ${timeout}ms.`); });
    });
  }
}

export default Device;