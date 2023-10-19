/* eslint-disable @typescript-eslint/no-explicit-any */

import Storage from './Storage.js';
import { IYeeDevice, TYeeDeviceProps, IMusicServer } from './interfaces.js';
import net from 'node:net';
import { isDev } from './config.js';

export interface IDeviceParams {
  writeTimeoutMs?: number,
}

const socketDefaultTimeout = 5000;

const deviceDefaultParams: IDeviceParams = {
  writeTimeoutMs: socketDefaultTimeout,
};


export class Device {
  private cmdId = 1;
  private device: IYeeDevice;
  private storage: Storage;
  private socket: net.Socket;
  private params: IDeviceParams = deviceDefaultParams;
  // private musicServer: net.Server | undefined;

  constructor(id: string, storage: Storage, params?: IDeviceParams) {
    this.storage = storage;

    const device = this.storage.getOne(id);
    if (!device) {
      throw new TypeError(`[yee-ts]: Device (${id}) is not found in provided storage.`);
    }

    for (const key in params) {
      this.params[key] = params[key];
    }

    this.device = device;
    this.device.id = id;

    this.socket = this._createSocket(55439, this.params.writeTimeoutMs);

    // let isMSListeners = false;
    const listenSocket = this._createSocket(55429);
    listenSocket.setKeepAlive(true);

    listenSocket.on('data', payload => {
      if (isDev) {
        console.log(`[yee-ts <DEV>]: Response message: ${payload.toString()}`);

        const data: { method: string, params: { [attr: string]: any } } = JSON.parse(payload.toString());
        console.log(data);

        for (const key in data.params) {
          this.device[key] = data.params[key];
        }

        // Rewrite auto field
        if (data.params.power === 'on') {
          this.device.power = true;
        } else if (data.params.power === 'off') {
          this.device.power = false;
        }

        if (data.params.flowing || data.params.flow_params) {
          this.device.flowing = true;
        } else {
          this.device.flowing = false;
        }

        console.log(this.device);
      }

      // if (this.musicServer && !isMSListeners) {
      //   isMSListeners = true;
      //   this.musicServer.on('connection', socket => console.log('connected', socket));
      //   this.musicServer.on('listening', () => console.log('listening'));
      // }
    });

    listenSocket.on('error', e => {
      throw new Error(`[yee-ts]: Listen socket error: ${JSON.stringify(e)}`);
    });
  }

  private async _sendCommand(command: { method: string, params: any }): Promise<string> {
    return new Promise((resolve, reject) => {
      command.params = command.params || [];
      const payload = `${JSON.stringify({ id: this.cmdId, ...command })}\r\n`;

      this.socket.on('error', e => reject(`[yee-ts]: Write socket error: ${JSON.stringify(e)}`));
      this.socket.on('timeout', () => { reject(`[yee-ts]: Write socket timeouted ${this.params.writeTimeoutMs}ms.`); });

      this.socket.write(payload, async e => {
        if (e) return;
        this.cmdId++;

        if (isDev) {
          console.log(`[yee-ts <DEV>]: Writed payload ${payload}`);
        }

        return resolve('ok');
      });
    });
  }

  private _createSocket(port = 55439, timeout = socketDefaultTimeout): net.Socket {
    try {
      return net.createConnection({
        port: 55443,
        host: this.device.ip,
        localAddress: '0.0.0.0',
        localPort: port,
        timeout,
      });
    } catch (e) {
      throw new Error(`[yee-ts]: Socket error - ${JSON.stringify(e)}`);
    }
  }



  getDevice(): IYeeDevice {
    return this.device;
  }

  getProp(param: TYeeDeviceProps) {
    return this.device[param] || null;
  }

  async sendCommand(command: { method: string, params: any[] }) {
    return await this._sendCommand(command);
  }

  async setRgb(r: number, g: number, b: number, params?: any[]) {
    const rgb = (r * 65536) + (g * 256) + b;

    params = params || [];
    params.unshift(rgb);

    return await this._sendCommand({ method: 'set_rgb', params });
  }

  // hsv

  async setBright(brightness: number, params?: any[]) {
    params = params || [];
    params?.unshift(brightness);

    return await this._sendCommand({ method: 'set_bright', params });
  }

  async turnOn(params?: any[]) {
    params = params || [];
    params?.unshift('on');

    return await this._sendCommand({ method: 'set_power', params });
  }

  async turnOff(params?: any[]) {
    params = params || [];
    params?.unshift('off');

    return await this._sendCommand({ method: 'set_power', params });
  }

  async toggle(params?: any[]) {
    return await this._sendCommand({ method: 'toggle', params, });
  }

  // TODO Verify behaivour
  // async setDefaults(props?: ISendCommandProps) {
  //   return await this._sendCommand({ method: 'set_default', params: [] }, props);
  // }

  // TODO Create and operate own TCP server, see set_music prop in yeelight api
  // createMusicModeServer(host = '0.0.0.0', port = 48925): IMusicServer {
  //   return { server: new net.Server(), port, host };
  // }

  // async turnOnMusicMode({ server, host, port }: IMusicServer, props?: ISendCommandProps) {
  //   this.device.musicMode = true;
  //   this.musicServer = server;
  //   server.listen({
  //     port,
  //     host
  //   });

  //   return await this._sendCommand({ method: 'set_music', params: [1, host, port] }, props);
  // }
}

export default Device;