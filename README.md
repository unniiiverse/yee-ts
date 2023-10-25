# Yee-ts
Simple typescript implementation of yeelight [API Docs](https://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf)

## Compatibility
Package should work fine with all yeelight smart devices. Currently tested only with:
+ Yeelight Smart Bulb W3

If this package works fine with other yeelight devices, please notify me in issues.

## Usage
```ts
import {Yeelight, Storage} from 'yee-ts'

// Default usage (discovery provides storage)
async function foo() {
  const yee = new Yeelight();
  await yee.discover() // Discover yeelight devices.

  const device = yee.createDevice('ID') // Create device with bulb id
  await device.toggle() // Use
}

// Only light control (custom storage)
async function bar() {
  const yee = new Yeelight();
  const storage = new Storage([{
      id: '123',
      ip: '192.168.0.1'
    }])

  const device = yee.createDevice('123', storage) // Create device with bulb id
  await device.toggle() // Use
}
```

## API
```ts
import { Yeelight, Storage } from 'yee-ts'
new Yeelight()
  .getDevice(id: string): IYeeDevice // Get single device
  .getDevices(): IYeeDevice[] // Get list of devices
  .createDevice(): Device // Create new device connection

new Storage(storage?: IYeeDevice[])
  .getAll() // Similar to getDevices in Yeelight
  .getOne() // Similar to getDevice in Yeelight
  .updateAll(devices: IYeeDevice[])

new Yeelight().createDevice()
  .getDevice() // Get device props
  . // Listed in available methods
```

### Device default params
```ts
const deviceDefaultParams: IDeviceParams = {
  writeTimeoutMs: 5000,
  writeSocketPort: 55439,
  listenSocketPort: 55429,
  defaultEffect: 'smooth',
  effectDuration: 300,
};
```

### Full api is too large, use typescript, please

## Handlers
```ts
// ct < 1700 | > 6500 = range error / true
ctCheckRange(ct: number)
// full < 0 | > 16777215 or rgb < 0 | > 255 = range error / true. Full code is more priotired.
rgbCheckRange(full: number | null, r: number, g: number, b: number)
// hue < 0 || hue > 359 = range error / true
hueCheckRange(hue: number)
// sat < 0 || sat > 100 = range error / true
satCheckRange(sat: number)


// converts rgb to full number ((r * 65536) + (g * 256) + b)
rgbToFull(r: number, g: number, b: number)
```

## Events
```ts
interface IDeviceEmitter {
  response: (data: { method: string, params: { [attr: string]: any } }, device: IYeeDevice) => void
}
```

## Download
Package also available on NPM
```
npm i yee-ts
```

<hr>

License: MIT <br>
Last update: 1.3.0<br>
unniiiverse 2023 