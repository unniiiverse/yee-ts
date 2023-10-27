import { Device } from '../Device';
import { Storage } from '../Storage';

describe('Device', () => {
  const device = new Device('foo', new Storage([{
    id: 'foo',
    ip: '192.168.0.201',
    power: true,
  }]), {
    isTest: true
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

  describe('set_power (turnOn/off)', () => {
    test('turn on (success)', async () => {
      const device = new Device('foo', new Storage([{
        id: 'foo',
        ip: '192.168.0.201',
        power: false,
      }]), {
        isTest: true
      });

      expect(await device.turnOn({
        isTest: true
      })).toStrictEqual({
        method: 'set_power',
        params: ['on', 'smooth', 300, 0]
      });
    });

    test('turn on (already on)', async () => {
      expect(await device.turnOn({
        isTest: true
      })).toBe(true);
    });

    test('turn off (success)', async () => {
      expect(await device.turnOff({
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
});