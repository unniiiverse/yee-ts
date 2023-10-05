import { IYeeDevice } from './interfaces.js';

export class Storage {
  private storage: IYeeDevice[] = [];

  constructor(storage?: IYeeDevice[]) {
    this.storage = storage || [];
  }

  parseBuffer(msg: Buffer): IYeeDevice[] | null {
    const data = msg.toString().split('\r\n');

    const payload: IYeeDevice[] = [];
    let tempLoad: IYeeDevice = {
      id: '',
      bright: 0,
      color_mode: 1,
      ip: '',
      model: '',
      port: 0,
      power: false
    };

    // Assign payload
    data.forEach(el => {
      const notRequiredProps = ['ct', 'rgb', 'hue', 'sat', 'name', 'port', 'model', 'power', 'bright', 'color_mode'];
      const props = ['id', 'ip', ...notRequiredProps];

      // Match new object
      if (el.match(/^HTTP/gi)) {
        payload.push(tempLoad);

        tempLoad = {
          id: '',
          bright: 0,
          color_mode: 1,
          ip: '',
          model: '',
          port: 0,
          power: false
        };
      }

      if (props.includes(el.split(':')[0])) {
        tempLoad[el.split(': ')[0]] = (+el.split(': ')[1]) ? +el.split(': ')[1] : el.split(': ')[1];
      }

      if (el.split(':')[0] === 'Location') {
        tempLoad.ip = el.split('//')[1].split(':')[0];
        tempLoad.port = +el.split('//')[1].split(':')[1];
      } else if (el.split(':')[0] === 'id') {
        tempLoad.id = el.split(': ')[1];
      } else if (el.split(':')[0] === 'fw_ver') {
        tempLoad.fw = +el.split(': ')[1];
      }

      // Change assigned field to interface format
      // @ts-expect-error foreach replaces field type
      if (tempLoad.power === 'on' || tempLoad.power === true) {
        tempLoad.power = true;
      } else {
        tempLoad.power = false;
      }
    });

    payload.splice(0, 1);
    payload.push(tempLoad);

    this.updateAll(payload);
    return payload || null;
  }

  getAll(): IYeeDevice[] | null {
    return this.storage || null;
  }

  getOne(id: string): IYeeDevice | null {
    return this.storage.find(el => el.id === id) || null;
  }

  updateAll(devices: IYeeDevice[]) {
    this.storage = devices;
  }
}

export default Storage;