/* eslint-disable @typescript-eslint/no-explicit-any */

import Storage from './Storage.js';
import { IYeeDevice, TYeeDeviceProps } from './interfaces.js';
import net from 'node:net';
import { TypedEmitter } from 'tiny-typed-emitter';
import { isDev } from './config.js';

interface ISendCommandProps {
  timeout?: 1500
}

interface DeviceEvents {
  'data': (data: { method: string, params: object }) => void
}

let DEV_SUCCESS_REQ_COUNT = 0;

export class Device extends TypedEmitter<DeviceEvents> {
  private cmdI = 0;
  private device: IYeeDevice;
  private storage: Storage;
  private socket: net.Socket | undefined;

  constructor(id: string, storage: Storage) {
    super();
    this.storage = storage;

    const device = this.storage.getOne(id);
    if (!device) {
      throw new TypeError(`[yee-ts]: Device with id ${id} is not found.`);
    }

    this.device = device;
    this.device.id = id;

    const listenSocket = this._createSocket(5000);

    listenSocket.on('data', data => {
      if (isDev) {
        DEV_SUCCESS_REQ_COUNT++;
        console.log(`[yee-ts <DEV>]: Success requests: ${DEV_SUCCESS_REQ_COUNT}`);
        console.log(`[yee-ts <DEV>]: Response message: ${data.toString()}`);

        // TODO EVENTS
        this.emit('data', JSON.parse(data.toString()));
      }
    });

    listenSocket.on('error', e => {
      throw new Error(`[yee-ts]: Listen socket error: ${JSON.stringify(e)}`);
    });
  }

  private async _sendCommand(command: { method: string, params: any }, props?: ISendCommandProps): Promise<void> {
    return new Promise((resolve, reject) => {
      const payload = `${JSON.stringify({ id: this.cmdI, ...command })}\r\n`;

      const defaultTimeout = 5000;
      const timeout = props?.timeout || defaultTimeout;

      this.socket = this._createSocket(timeout);
      const socket = this.socket;

      socket.write(payload, e => {
        if (e) return reject(e);

        socket.write(' ', e => {
          if (e) return reject(e);
          this.cmdI++;
        });

        this.cmdI++;

        if (isDev) {
          console.log(`[yee-ts <DEV>]: Writed payload ${payload}`);
        }

        socket.destroy();
        return resolve();
      });

      socket.on('error', reject);
      socket.on('timeout', () => { reject(`[yee-ts]: Socket timeouted ${timeout}ms.`); });
    });
  }

  private _createSocket(timeout: number): net.Socket {
    return net.createConnection({
      port: 55443,
      host: this.device.ip,
      timeout,
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

  // TODO Verify behaivour
  // async setDefaults(props?: ISendCommandProps) {
  //   return await this._sendCommand({ method: 'set_default', params: [] }, props);
  // }

  // TODO Create and operate own TCP server, see set_music prop in yeelight api
  // async turnOnMusicMode(params?: any[], props?: ISendCommandProps) {
  //   params = params || [];
  //   params?.unshift(1);
  //   return await this._sendCommand({ method: 'set_music', params: [] }, props);
  // }
}

export default Device;