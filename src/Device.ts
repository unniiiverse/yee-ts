/* eslint-disable @typescript-eslint/no-explicit-any */

import Storage from './Storage';
import { IYeeDevice, TYeeDeviceProps, IColorFlow, TDeviceEffect } from './interfaces';
import net from 'node:net';
import { isDev } from './config';
import { TypedEmitter } from 'tiny-typed-emitter';
import * as handler from './deviceHandlers';

type TDevicePowerModes = 0 | 1 | 2 | 3 | 4 | 5;

export interface IDeviceParams {
  writeTimeoutMs?: number,
  writeSocketPort?: number,
  listenSocketPort?: number,
  defaultEffect?: TDeviceEffect,
  effectDuration?: number,
  defaultMode?: TDevicePowerModes,
  isTest?: boolean
}

interface IDeviceEmitter {
  response: (data: { method: string, params: { [attr: string]: any } }, device: IYeeDevice) => void
}

const socketDefaultTimeout = 5000;

const deviceDefaultParams: IDeviceParams = {
  writeTimeoutMs: socketDefaultTimeout,
  writeSocketPort: 55439,
  listenSocketPort: 55429,
  defaultEffect: 'smooth',
  effectDuration: 300,
  defaultMode: 0,
  isTest: false
};

export class Device extends TypedEmitter<IDeviceEmitter> {
  private cmdId = 1;
  private listenSocketRetry = 0;
  private device: IYeeDevice;
  private storage: Storage;
  private socket: net.Socket;
  private params: IDeviceParams = deviceDefaultParams;

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

    if (!this.params.isTest) {
      this._listenConnect();
    } else {
      this.socket.destroy();
    }
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

  private _ensurePower(val: boolean) {
    if (this.device.power !== val) {
      throw new TypeError(`[yee-ts]: Device must be ${val}, or provide power state in storage.`);
    }
  }

  private _listenConnect() {
    try {
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
      });

      listenSocket.on('error', e => {
        if (this.listenSocketRetry < 3) {
          listenSocket.destroy();
          this._listenConnect();
          this.listenSocketRetry++;
          throw new Error(`[yee-ts]: Listen socket error (connection retried ${this.listenSocketRetry} times): ${JSON.stringify(e)}`);
        } else {
          throw new Error(`[yee-ts]: Listen socket error (socket retried 3 times): ${JSON.stringify(e)}`);
        }
      });
    } catch (e) {
      if (this.listenSocketRetry < 3) {
        this._listenConnect();
        this.listenSocketRetry++;
        throw new Error(`[yee-ts]: Listen socket error (connection retried ${this.listenSocketRetry} times): ${JSON.stringify(e)}`);
      } else {
        throw new Error(`[yee-ts]: Listen socket error (socket retried 3 times): ${JSON.stringify(e)}`);
      }
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

  async set_ct_abx({ ct, duration, effect, isBg, isTest }: IDeviceSetCtAbx) {
    this._ensurePower(true);
    handler.ctCheckRange(ct);

    effect = effect || this.params.defaultEffect;
    duration = duration || this.params.effectDuration;

    const payload = { method: `${isBg ? 'bg_' : ''}set_ct_abx`, params: [ct, effect, duration] };

    if (isTest) {
      return payload;
    }

    return await this._sendCommand(payload);
  }

  async set_rgb({ full, r, g, b, effect, duration, isBg, isTest }: IDeviceSetRgb) {
    this._ensurePower(true);

    effect = effect || this.params.defaultEffect;
    duration = duration || this.params.effectDuration;

    let rgb = 0;

    if (full) {
      handler.rgbCheckRange(full, 0, 0, 0);
      rgb = full;
    } else if (r && g && b) {
      handler.rgbCheckRange(null, r, g, b);
      rgb = handler.rgbToFull(r, g, b);
    } else {
      throw TypeError('[yee-ts]: Full rgb or r g b is not provided.');
    }

    const payload = { method: `${isBg ? 'bg_' : ''}set_rgb`, params: [rgb, effect, duration] };

    if (isTest) {
      return payload;
    }

    return await this._sendCommand(payload);
  }

  async set_hsv({ hue, sat, effect, duration, isBg, isTest }: IDeviceSetHsv) {
    this._ensurePower(true);

    effect = effect || this.params.defaultEffect;
    duration = duration || this.params.effectDuration;

    const payload = { method: `${isBg ? 'bg_' : ''}set_hsv`, params: [hue, sat, effect, duration] };

    if (isTest) {
      return payload;
    }

    return await this._sendCommand(payload);
  }

  async set_bright({ bright, effect, duration, isBg, isTest }: IDeviceSetBright) {
    this._ensurePower(true);
    handler.brightCheckRange(bright);

    effect = effect || this.params.defaultEffect;
    duration = duration || this.params.effectDuration;

    const payload = { method: `${isBg ? 'bg_' : ''}set_bright`, params: [bright, effect, duration] };

    if (isTest) {
      return payload;
    }

    return await this._sendCommand(payload);
  }

  async turnOn({ duration, effect, mode, isBg, isTest }: IDeviceSetPower) {
    if (this.device.power === true) {
      if (!isTest && !this.params.isTest) {
        console.log('[yee-ts]: power is already on');
      }
      return true;
    }

    effect = effect || this.params.defaultEffect;
    duration = duration || this.params.effectDuration;
    mode = mode || this.params.defaultMode;

    const payload = { method: `${isBg ? 'bg_' : ''}set_power`, params: ['on', effect, duration, mode] };

    if (isTest) {
      return payload;
    }

    return await this._sendCommand(payload);
  }

  async turnOff({ duration, effect, mode, isBg, isTest }: IDeviceSetPower) {
    if (this.device.power === false) {
      if (!isTest || !this.params.isTest) {
        console.log('[yee-ts]: power is already off');
      }
      return true;
    }

    effect = effect || this.params.defaultEffect;
    duration = duration || this.params.effectDuration;
    mode = mode || this.params.defaultMode;

    const payload = { method: `${isBg ? 'bg_' : ''}set_power`, params: ['off', effect, duration, mode] };

    if (isTest) {
      return payload;
    }

    return await this._sendCommand(payload);
  }

  async toggle({ isBg, isTest, isDev }: IDeviceToggle) {
    const payload = { method: `${isBg ? 'bg_' : isDev ? 'dev_' : ''}toggle`, params: [] };

    if (isTest) {
      return payload;
    }

    return await this._sendCommand(payload);
  }

  // async setDefault(isBg?: false) {
  //   this._ensurePowerOn();

  //   return await this._sendCommand({ method: `${isBg ? 'bg_' : ''}set_default`, params: [] });
  // }

  // async startCf(repeat: number, action: 0 | 1 | 2, flow: IColorFlow[] | string, isBg?: false) {
  //   this._ensurePowerOn();

  //   if (!Array.isArray(flow)) {
  //     return await this._sendCommand({ method: 'start_cf', params: [repeat, action, flow] });
  //   }

  //   const flow_exp: string[] = [];
  //   flow.forEach(fl => {
  //     if (fl.brightness < 1 || fl.brightness > 100) {
  //       throw new RangeError('[yee-ts]: Flow brightness must be in range between 1 - 100');
  //     }

  //     if (fl.duration < 50) {
  //       throw new RangeError('[yee-ts]: Flow duration must be more than 50ms');
  //     }

  //     if (fl.mode === 1) {
  //       if (fl.value < 0 || fl.value > 16777215) {
  //         throw new RangeError('[yee-ts]: Flow RGB (mode 1) must be in range between 0 - 16777215');
  //       }
  //     } else if (fl.mode === 2) {
  //       if (fl.value < 1700 || fl.value > 6500) {
  //         throw new RangeError('[yee-ts]: Flow CT (mode 2) must be in range between 1700 - 6500');
  //       }
  //     }

  //     flow_exp.push(`${fl.duration},${fl.mode},${fl.value},${fl.brightness}`);
  //   });

  //   return await this._sendCommand({ method: `${isBg ? 'bg_' : ''}start_cf`, params: [repeat, action, flow_exp.join(',')] });
  // }

  // async stopCf(isBg?: false) {
  //   return await this._sendCommand({ method: `${isBg ? 'bg_' : ''}stop_cf`, params: [] });
  // }

  // async setScene(scene: 'color' | 'hsv' | 'ct' | 'cf' | 'auto_delay_off', params: any[], isBg?: false) {
  //   if (scene === 'color') {
  //     await this.setRgb(params[0], 0, 0, 0);
  //     return await this.setBright(params[1], [], isBg);
  //   } else if (scene === 'hsv') {
  //     await this.setHsv(params[0], params[1]);
  //     return await this.setBright(params[2], [], isBg);
  //   } else if (scene === 'ct') {
  //     await this.setCtAbx(params[0]);
  //     return await this.setBright(params[1], [], isBg);
  //   } else if (scene === 'cf') {
  //     await this.startCf(params[0], params[1], params[2]);
  //     return await this.setBright(params[3], [], isBg);
  //   } else if (scene === 'auto_delay_off') {
  //     setTimeout(() => {
  //       this.device.power = false;
  //     }, params[1]);
  //     return await this._sendCommand({ method: `${isBg ? 'bg_' : ''}set_scene`, params: ['auto_delay_off', params[0], params[1]] });
  //   }
  // }
}

interface IDeviceDefault {
  isBg?: boolean,
  isTest?: boolean,
}

interface IDeviceDefaultWEffect extends IDeviceDefault {
  duration?: number,
  effect?: TDeviceEffect
}

interface IDeviceSetCtAbx extends IDeviceDefaultWEffect {
  ct: number,
}

interface IDeviceSetRgb extends IDeviceDefaultWEffect {
  full?: number,
  r?: number,
  g?: number,
  b?: number,
}

interface IDeviceSetHsv extends IDeviceDefaultWEffect {
  hue: number,
  sat: number
}

interface IDeviceSetBright extends IDeviceDefaultWEffect {
  bright: number,
}

interface IDeviceSetPower extends IDeviceDefaultWEffect {
  mode?: TDevicePowerModes
}

interface IDeviceToggle extends IDeviceDefault {
  isDev?: boolean
}

export default Device;