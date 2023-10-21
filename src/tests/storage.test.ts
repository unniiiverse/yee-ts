// @ts-expect-error import ts file to jest
import { Storage } from '../Storage.ts';

describe('Storage tests', () => {
  test('Buffer parsing correctly', () => {
    const storage = new Storage();
    const parsed = storage.parseBuffer(Buffer.from('HTTP/1.1 200 OK\r\nCache-Control: max-age=3600\r\nDate:\r\nExt:\r\nLocation: yeelight://192.168.0.201:55443\r\nServer: POSIX UPnP/1.0 YGLC/1\r\nid: 0x000000001c01864a\r\nmodel: colorb\r\nfw_ver: 10\r\nsupport: get_prop set_default set_power toggle set_bright set_scene cron_add cron_get cron_del start_cf stop_cf set_ct_abx adjust_ct set_name set_adjust adjust_bright adjust_color set_rgb set_hsv set_music udp_sess_new udp_sess_keep_alive udp_chroma_sess_new\r\npower: off\r\nbright: 1\r\ncolor_mode: 1\r\nct: 2000\r\nrgb: 16119546\r\nhue: 228\r\nsat: 2\r\nname:\r\n'));

    expect(parsed).toEqual([
      {
        id: '0x000000001c01864a',
        bright: 1,
        color_mode: 1,
        ip: '192.168.0.201',
        model: 'colorb',
        port: 55443,
        power: false,
        fw: 10,
        ct: 2000,
        rgb: 16119546,
        hue: 228,
        sat: 2,
        'name:': undefined
      }
    ]);
  });

  test('getAll() return all devices (not empty)', () => {
    const devices = [
      {
        id: '0x000000001c01864a',
        ip: '192.168.0.201',
      },
      {
        id: '0x000000001c01864a',
        ip: '192.168.0.201',
      }
    ];

    const storage = new Storage(devices);

    expect(storage.getAll()).toEqual(devices);
  });

  test('getAll() return null (empty)', () => {
    const devices = [];
    const storage = new Storage(devices);

    expect(storage.getAll()).toEqual(devices);
  });

  test('getOne() return device (not empty)', () => {
    const devices = [
      {
        id: '123',
        ip: '192.168.0.201',
      },
      {
        id: '456',
        ip: '192.168.0.201',
      }
    ];

    const storage = new Storage(devices);

    expect(storage.getOne('123')).not.toBeNull();
  });

  test('getOne() return null (not found)', () => {
    const devices = [
      {
        id: '123',
        ip: '192.168.0.201',
      },
      {
        id: '456',
        ip: '192.168.0.201',
      }
    ];

    const storage = new Storage(devices);

    expect(storage.getOne('not_exist')).toBeNull();
  });

  test('updateAll() updates storage', () => {
    const devices = [
      {
        id: '123',
        ip: '192.168.0.201',
      },
      {
        id: '456',
        ip: '192.168.0.201',
      }
    ];

    const storage = new Storage([{
      id: '123',
      ip: '192.168.0.201',
    }]);

    storage.updateAll(devices);

    expect(storage.getOne('456')).not.toBeNull();
  });
});