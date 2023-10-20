import dgram from 'node:dgram';
import EventEmitter from 'node:events';
import ip from 'ip';

const options = {
  port: 1982,
  multicastAddr: '239.255.255.250',
  discoveryMsg: 'M-SEARCH * HTTP/1.1\r\nMAN: "ssdp:discover"\r\nST: wifi_bulb\r\n',
};


export class Discovery extends EventEmitter {
  private socket: dgram.Socket;
  private config = options;

  constructor() {
    super();
    this.socket = dgram.createSocket('udp4');
  }

  discover(): void {
    this.socket.on('message', (msg, rinfo) => this.emit('message', msg, rinfo));
    this.socket.on('error', e => this.emit('error', e));

    this.socket.bind(43210, ip.address(), () => {
      this.socket.send(this.config.discoveryMsg, this.config.port, this.config.multicastAddr);
    });
  }
}

export default Discovery;