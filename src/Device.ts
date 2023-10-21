/* eslint-disable @typescript-eslint/no-explicit-any */

import Storage from './Storage.js';
import { IYeeDevice, TYeeDeviceProps, IMusicServer, IColorFlow } from './interfaces.js';
import net from 'node:net';
import { isDev } from './config.js';
import { TypedEmitter } from 'tiny-typed-emitter';

export interface IDeviceParams {
  writeTimeoutMs?: number,
  writeSocketPort?: number,
  listenSocketPort?: number
}

interface IDeviceEmitter {
  response: (data: { method: string, params: { [attr: string]: any } }, device: IYeeDevice) => void
}

const socketDefaultTimeout = 5000;

const deviceDefaultParams: IDeviceParams = {
  writeTimeoutMs: socketDefaultTimeout,
  writeSocketPort: 55439,
  listenSocketPort: 55429,
};


export class Device extends TypedEmitter<IDeviceEmitter> {
  private cmdId = 1;
  private device: IYeeDevice;
  private storage: Storage;
  private socket: net.Socket;
  private params: IDeviceParams = deviceDefaultParams;
  // private musicServer: net.Server | undefined;

  constructor(id: string, storage: Storage, params?: IDeviceParams) {
    super();
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

    this.socket = this._createSocket(this.params.writeSocketPort, this.params.writeTimeoutMs);

    // let isMSListeners = false;
    const listenSocket = this._createSocket(this.params.listenSocketPort);
    listenSocket.setKeepAlive(true);

    listenSocket.on('data', payload => {
      const data: { method: string, params: { [attr: string]: any } } = JSON.parse(payload.toString());

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

      this.emit('response', data, this.device);

      if (isDev) {
        console.log(`[yee-ts <DEV>]: Response message: ${payload.toString()}`);
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

  private async _sendCommand(command: { method: string, params: any }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      command.params = command.params || [];
      const payload = `${JSON.stringify({ id: this.cmdId, ...command })}\r\n`;

      this.socket.on('error', e => reject(`[yee-ts]: Write socket error: ${JSON.stringify(e)}`));
      this.socket.on('timeout', () => { reject(`[yee-ts]: Write socket timeouted ${this.params.writeTimeoutMs}ms.`); });

      const openingInterval = setInterval(() => {
        if (this.socket.readyState !== 'open') {
          return;
        }

        clearInterval(openingInterval);

        this.socket.write(payload, async e => {
          if (e) return;
          this.cmdId++;

          if (isDev) {
            console.log(`[yee-ts <DEV>]: Writed payload ${payload}`);
          }

          return resolve(true);
        });
      }, 50);
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

  private _ensurePowerOn() {
    if (!this.device.power) {
      throw new TypeError('[yee-ts]: Device must be on, or provide power state in storage.');
    }
  }



  //* TEMPLATE
  // async name(params?: any[]) {
  //   params = params || [];
  //   params.unshift('');

  //   return await this._sendCommand({ method: '', params });
  // }

  getDevice(): IYeeDevice {
    return this.device;
  }

  getProp(param: TYeeDeviceProps) {
    return this.device[param] || null;
  }

  async sendCommand(command: { method: string, params: any[] }) {
    return await this._sendCommand(command);
  }

  async setCtAbx(ct: number, params?: any[]) {
    this._ensurePowerOn();

    if (ct < 1700 || ct > 6500) {
      throw new RangeError('[yee-ts]: Ct value must be in range between 1700 - 6500');
    }

    params = params || [];
    params.unshift(ct);

    return await this._sendCommand({ method: 'set_ct_abx', params });
  }

  async setRgb(rgbFull: number | null, r: number, g: number, b: number, params?: any[]) {
    this._ensurePowerOn();

    if (rgbFull) {
      if (rgbFull < 0 || rgbFull > 16777215) {
        throw new RangeError('[yee-ts]: RGB must be in range between 0 - 16777215');
      }

      params = params || [];
      params.unshift(rgbFull);

      return await this._sendCommand({ method: 'set_rgb', params });
    }

    if (r < 0 || r > 256) {
      throw new RangeError('[yee-ts]: Red value must be in range between 0 - 256');
    } else if (g < 0 || g > 256) {
      throw new RangeError('[yee-ts]: Gren value must be in range between 0 - 256');
    } else if (b < 0 || b > 256) {
      throw new RangeError('[yee-ts]: Blue value must be in range between 0 - 256');
    }

    const rgb = (r * 65536) + (g * 256) + b;

    params = params || [];
    params.unshift(rgb);

    return await this._sendCommand({ method: 'set_rgb', params });
  }

  async setHsv(hue: number, sat: number, params?: any[]) {
    this._ensurePowerOn();

    if (hue < 0 || hue > 359) {
      throw new RangeError('[yee-ts]: Hue value must be in range between 0 - 359');
    }

    if (sat < 0 || sat > 100) {
      throw new RangeError('[yee-ts]: Sat value must be in range between 0 - 100');
    }

    params = params || [];
    params.unshift('');

    return await this._sendCommand({ method: 'set_hsv', params });
  }

  async setBright(brightness: number, params?: any[]) {
    this._ensurePowerOn();

    if (brightness < 1 || brightness > 100) {
      throw new RangeError('[yee-ts]: Bright value must be in range between 1 - 100');
    }

    params = params || [];
    params.unshift(brightness);

    return await this._sendCommand({ method: 'set_bright', params });
  }

  async turnOn(params?: any[]) {
    if (this.device.power === true) {
      console.log('[yee-ts]: power is already on');
      return true;
    }

    params = params || [];
    params.unshift('on');

    return await this._sendCommand({ method: 'set_power', params });
  }

  async turnOff(params?: any[]) {
    if (this.device.power === false) {
      console.log('[yee-ts]: power is already off');
      return true;
    }

    params = params || [];
    params.unshift('off');

    return await this._sendCommand({ method: 'set_power', params });
  }

  async toggle() {
    return await this._sendCommand({ method: 'toggle', params: [], });
  }

  async setDefault() {
    this._ensurePowerOn();

    return await this._sendCommand({ method: 'set_default', params: [] });
  }

  async startCf(repeat: number, action: 0 | 1 | 2, flow: IColorFlow[] | string) {
    this._ensurePowerOn();

    if (!Array.isArray(flow)) {
      return await this._sendCommand({ method: 'start_cf', params: [repeat, action, flow] });
    }

    const flow_exp: string[] = [];
    flow.forEach(fl => {
      if (fl.brightness < 1 || fl.brightness > 100) {
        throw new RangeError('[yee-ts]: Flow brightness must be in range between 1 - 100');
      }

      if (fl.duration < 50) {
        throw new RangeError('[yee-ts]: Flow duration must be more than 50ms');
      }

      if (fl.mode === 1) {
        if (fl.value < 0 || fl.value > 16777215) {
          throw new RangeError('[yee-ts]: Flow RGB (mode 1) must be in range between 0 - 16777215');
        }
      } else if (fl.mode === 2) {
        if (fl.value < 1700 || fl.value > 6500) {
          throw new RangeError('[yee-ts]: Flow CT (mode 2) must be in range between 1700 - 6500');
        }
      }

      flow_exp.push(`${fl.duration},${fl.mode},${fl.value},${fl.brightness}`);
    });

    return await this._sendCommand({ method: 'start_cf', params: [repeat, action, flow_exp.join(',')] });
  }

  async stopCf() {
    return await this._sendCommand({ method: 'stop_cf', params: [] });
  }

  async setScene(scene: 'color' | 'hsv' | 'ct' | 'cf' | 'auto_delay_off', params: any[]) {
    if (scene === 'color') {
      await this.setRgb(params[0], 0, 0, 0);
      return await this.setBright(params[1]);
    } else if (scene === 'hsv') {
      await this.setHsv(params[0], params[1]);
      return await this.setBright(params[2]);
    } else if (scene === 'ct') {
      await this.setCtAbx(params[0]);
      return await this.setBright(params[1]);
    } else if (scene === 'cf') {
      await this.startCf(params[0], params[1], params[2]);
      return await this.setBright(params[3]);
    } else if (scene === 'auto_delay_off') {
      setTimeout(() => {
        this.device.power = false;
        console.log(this.device);
      }, params[1]);
      return await this._sendCommand({ method: 'set_scene', params: ['auto_delay_off', params[0], params[1]] });
    }
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