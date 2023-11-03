import { Device } from '../Device';
import { Storage } from '../Storage';

describe('Device', () => {
  const device = new Device('foo', new Storage([{
    id: 'foo',
    ip: '192.168.0.201',
    power: true,
  }]), {
    isTest: true,
    writeSocketPort: 0,
    listenSocketPort: 0
  });

  beforeEach(() => {
    device.updateStorage({
      id: 'foo',
      ip: '192.168.0.201',
      power: true,
    }, true);
  });

  describe('device tests', () => {
    test('device creating successfully', () => {
      expect(device.getDevice()).toBeTruthy();
    });

    test('device return it`s storage', () => {
      expect(device.getDevice()).toStrictEqual({
        id: 'foo',
        ip: '192.168.0.201',
        power: true,
      });
    });

    test('device return prop', () => {
      expect(device.getProp('ip')).toBe('192.168.0.201');
    });

    test('device return not existing prop', () => {
      expect(device.getProp('bright')).toBe(null);
    });
  });

  describe('test default methods', () => {
    test('changed defaults (success)', async () => {
      expect(await device.set_ct_abx({
        ct: 1800,
        duration: 1000,
        effect: 'sudden',
        isTest: true
      })).toStrictEqual({
        method: 'set_ct_abx',
        params: [1800, 'sudden', 1000]
      });
    });

    test('changed defaults with bg mode (success)', async () => {
      expect(await device.set_ct_abx({
        ct: 1800,
        duration: 1000,
        effect: 'sudden',
        isBg: true,
        isTest: true
      })).toStrictEqual({
        method: 'bg_set_ct_abx',
        params: [1800, 'sudden', 1000]
      });
    });
  });

  describe('set_ct_abx', () => {
    test('return payload (success)', async () => {
      expect(await device.set_ct_abx({
        ct: 2000,
        isTest: true
      })).toStrictEqual({
        method: 'set_ct_abx',
        params: [2000, 'smooth', 300]
      });
    });

    test('throw an error', async () => {
      try {
        await device.set_ct_abx({
          ct: 1000,
          isTest: true
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('set_rgb', () => {
    test('full rgb return payload (success)', async () => {
      expect(await device.set_rgb({
        full: 54363,
        isTest: true
      })).toStrictEqual({
        method: 'set_rgb',
        params: [54363, 'smooth', 300]
      });
    });

    test('sep rgb return payload (success)', async () => {
      expect(await device.set_rgb({
        r: 34,
        b: 52,
        g: 111,
        isTest: true
      })).toBeTruthy();
    });

    test('throw an error', async () => {
      try {
        await device.set_rgb({
          r: 4141,
          isTest: true
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('set_hsv', () => {
    test('return payload (success)', async () => {
      expect(await device.set_hsv({
        hue: 200,
        sat: 50,
        isTest: true
      })).toStrictEqual({
        method: 'set_hsv',
        params: [200, 50, 'smooth', 300]
      });
    });

    test('throw an error', async () => {
      try {
        await device.set_hsv({
          hue: 400,
          sat: 200,
          isTest: true
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('set_bright', () => {
    test('return payload (success)', async () => {
      expect(await device.set_bright({
        bright: 20,
        isTest: true
      })).toStrictEqual({
        method: 'set_bright',
        params: [20, 'smooth', 300]
      });
    });

    test('throw an error', async () => {
      try {
        await device.set_bright({
          bright: 103,
          isTest: true
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('set_power (turn_on/off)', () => {
    test('turn on (success)', async () => {
      const device = new Device('foo', new Storage([{
        id: 'foo',
        ip: '192.168.0.201',
        power: false,
      }]), {
        isTest: true
      });

      expect(await device.turn_on({
        isTest: true
      })).toStrictEqual({
        method: 'set_power',
        params: ['on', 'smooth', 300, 0]
      });
    });

    test('turn on (already on)', async () => {
      expect(await device.turn_on({
        isTest: true
      })).toBe(true);
    });

    test('turn off (success)', async () => {
      expect(await device.turn_off({
        isTest: true
      })).toStrictEqual({
        method: 'set_power',
        params: ['off', 'smooth', 300, 0]
      });
    });
  });

  describe('toggle', () => {
    test('return payload (success)', async () => {
      expect(await device.toggle({
        isTest: true
      })).toStrictEqual({
        method: 'toggle',
        params: []
      });
    });
  });

  describe('set_default', () => {
    test('return payload (success)', async () => {
      expect(await device.set_default({
        isTest: true
      })).toStrictEqual({
        method: 'set_default',
        params: []
      });
    });
  });

  describe('start_cf', () => {
    test('success with custom flow', async () => {
      expect(await device.start_cf({
        action: 0,
        flow: [
          {
            brightness: 50,
            duration: 100,
            mode: 1,
            value: 53689
          }
        ],
        repeat: 0,
        isTest: true
      })).toStrictEqual({
        method: 'start_cf',
        params: [0, 0, '100,1,53689,50']
      });
    });

    test('success with full flow', async () => {
      expect(await device.start_cf({
        action: 0,
        flow: '100,1,53689,50',
        repeat: 0,
        isTest: true
      })).toStrictEqual({
        method: 'start_cf',
        params: [0, 0, '100,1,53689,50']
      });
    });

    test('throw an error', async () => {
      try {
        await device.start_cf({
          action: 0,
          flow: [
            {
              brightness: 50,
              duration: 40,
              mode: 2,
              value: 53689
            }
          ],
          repeat: 0,
          isTest: true
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('stop_cf', () => {
    test('return payload (success)', async () => {
      expect(await device.stop_cf({
        isTest: true
      })).toStrictEqual({
        method: 'stop_cf',
        params: []
      });
    });
  });

  describe('set_scene', () => {
    test('success', async () => {
      expect(await device.set_scene({
        scene: 'cf',
        cfRepeat: 0,
        cfAction: 0,
        cfFlow: '100,1,53689,50',
        isTest: true
      })).toStrictEqual({
        method: 'start_cf',
        params: [0, 0, '100,1,53689,50']
      });
    });

    test('throw an error', async () => {
      try {
        await device.set_scene({
          scene: 'hsv',
          hue: 415,
          isTest: true
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('cron', () => {
    test('add', async () => {
      expect(await device.cron_add({
        delayMins: 10,
        type: 0,
        isTest: true
      })).toStrictEqual({
        method: 'cron_add',
        params: [0, 10]
      });
    });

    test('del', async () => {
      expect(await device.cron_del({
        type: 0,
        isTest: true
      })).toStrictEqual({
        method: 'cron_del',
        params: [0]
      });
    });
  });

  describe('set_adjust', () => {
    test('success set', async () => {
      expect(await device.set_adjust({
        action: 'increase',
        prop: 'bright',
        isTest: true
      })).toStrictEqual({
        method: 'set_adjust',
        params: ['increase', 'bright']
      });
    });

    test('failed set', async () => {
      try {
        await device.set_adjust({
          action: 'decrease',
          prop: 'color',
          isTest: true
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('set_name', () => {
    test('set name', async () => {
      expect(await device.set_name({
        name: 'haha',
        isTest: true
      })).toStrictEqual({
        method: 'set_name',
        params: ['haha']
      });
    });
  });

  describe('adjust', () => {
    test('bright', async () => {
      expect(await device.adjust_bright({
        percentage: 20,
        duration: 500,
        isTest: true
      })).toStrictEqual({
        method: 'adjust_bright',
        params: [20, 500]
      });
    });

    test('ct', async () => {
      expect(await device.adjust_ct({
        percentage: 20,
        duration: 500,
        isTest: true
      })).toStrictEqual({
        method: 'adjust_ct',
        params: [20, 500]
      });
    });

    test('color', async () => {
      expect(await device.adjust_color({
        percentage: 20,
        duration: 500,
        isTest: true
      })).toStrictEqual({
        method: 'adjust_color',
        params: [20, 500]
      });
    });
  });
});