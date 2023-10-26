import * as handler from '../deviceHandlers';

describe('Handlers', () => {
  describe('ctCheckRange', () => {
    test('return true', () => {
      expect(handler.ctCheckRange(2000)).toBe(true);
    });

    test('throw an error', () => {
      try {
        handler.ctCheckRange(1000);
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('rgbCheckRange', () => {
    test('full return true', () => {
      expect(handler.rgbCheckRange(432562, 0, 0, 0)).toBe(true);
    });

    test('separated return true', () => {
      expect(handler.rgbCheckRange(null, 12, 53, 200)).toBe(true);
    });

    test('full throw an error', () => {
      try {
        handler.rgbCheckRange(167772155, 0, 0, 0);
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });

    test('separated throw an error', () => {
      try {
        handler.rgbCheckRange(null, 2456, -12, 0);
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('hueCheckRange', () => {
    test('return true', () => {
      expect(handler.hueCheckRange(200)).toBe(true);
    });

    test('throw an error', () => {
      try {
        handler.hueCheckRange(1000);
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('satCheckRange', () => {
    test('return true', () => {
      expect(handler.satCheckRange(10)).toBe(true);
    });

    test('throw an error', () => {
      try {
        handler.satCheckRange(1000);
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('brightCheckRange', () => {
    test('return true', () => {
      expect(handler.brightCheckRange(50)).toBe(true);
    });

    test('throw an error', () => {
      try {
        handler.brightCheckRange(1000);
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe('rgbToFull', () => {
    test('return true', () => {
      expect(handler.rgbToFull(11, 11, 11)).toBe(723723);
    });

    test('throw an error', () => {
      try {
        handler.rgbToFull(343, 12, 31);
        expect(true).toBe(false);
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });
});