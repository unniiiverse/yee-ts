import dgram from 'dgram';
import EventEmitter from 'events';
import { APIConfig } from './config.js';

const discoveryCfg = {
  message: '',
  host: APIConfig.host,
  port: APIConfig.port
};

discoveryCfg.message = `M-SEARCH * HTTP/1.1\r\nHOST:${discoveryCfg.host}:${discoveryCfg.port}\r\nMAN:"ssdp:discover"\r\nST:wifi_bulb\r\n`;

export class Discovery extends EventEmitter {
  private socket: dgram.Socket;
  private config = discoveryCfg;

  constructor() {
    super();
    this.socket = dgram.createSocket('udp4');
  }

  discover(): void {
    this.socket.on('message', (msg, rinfo) => this.emit('message', msg, rinfo));

    this.socket.on('error', e => this.emit('error', e));

    try {
      this.socket.bind(43210, '0.0.0.0', () => this._onBoud());
    } catch (e) {
      this._onBoud();
    }
  }

  private _onBoud() {
    this.socket.send(this.config.message, 0, this.config.message.length, this.config.port, this.config.host);
  }
}

export default Discovery;