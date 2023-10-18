/* eslint-disable @typescript-eslint/no-explicit-any */

import Storage from './Storage.js';
import { IYeeDevice, TYeeDeviceProps, IMusicServer } from './interfaces.js';
import net from 'node:net';
import { TypedEmitter } from 'tiny-typed-emitter';
import { isDev } from './config.js';
import killPort from 'kill-port';

interface ISendCommandProps {
  timeout?: 1500
}

interface DeviceEvents {
  'data': (data: { method: string, params: object }) => void
}

let DEV_SUCCESS_REQ_COUNT = 0;

export class Device extends TypedEmitter<DeviceEvents> {
  private cmdI = 1;
  private device: IYeeDevice;
  private storage: Storage;
  private socket: net.Socket;
  // private musicServer: net.Server | undefined;

  constructor(id: string, storage: Storage) {
    super();
    this.storage = storage;

    const device = this.storage.getOne(id);
    if (!device) {
      throw new TypeError(`[yee-ts]: Device with id ${id} is not found.`);
    }

    this.device = device;
    this.device.id = id;

    this.socket = this._createSocket(5000, 55439);

    // let isMSListeners = false;
    const listenSocket = this._createSocket(5000, 5529);
    listenSocket.setKeepAlive(true);

    listenSocket.on('data', data => {
      if (isDev) {
        DEV_SUCCESS_REQ_COUNT++;
        console.log(`[yee-ts <DEV>]: Success requests: ${DEV_SUCCESS_REQ_COUNT}`);
        console.log(`[yee-ts <DEV>]: Response message: ${data.toString()}`);

        // TODO EVENTS
        this.emit('data', JSON.parse(data.toString()));
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

  private async _sendCommand(command: { method: string, params: any }, props?: ISendCommandProps): Promise<void> {
    return new Promise((resolve, reject) => {
      const payload = `${JSON.stringify({ id: this.cmdI, ...command })}\r\n`;

      const defaultTimeout = 5000;
      const timeout = props?.timeout || defaultTimeout;

      this.socket.on('error', reject);
      this.socket.on('timeout', () => { reject(`[yee-ts]: Socket timeouted ${timeout}ms.`); });

      this.socket.write(payload, async e => {
        if (e) return reject(e);
        this.cmdI++;

        if (isDev) {
          console.log(`[yee-ts <DEV>]: Writed payload ${payload}`);
        }

        return resolve();
      });
    });
  }

  private _createSocket(timeout: number, port: number): net.Socket {
    return net.createConnection({
      port: 55443,
      host: this.device.ip,
      localAddress: '0.0.0.0',
      localPort: port,
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