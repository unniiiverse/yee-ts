# Yee-ts
Simple typescript implementation of yeelight [API Docs](https://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf)

## Compatibility
Package should work with all yeelight smart devices. Currently tested only with:
+ Yeelight Smart Bulb W3

Package not tested with couple yeelight devices, so discovery may cause bugs.

## Usage
Make sure you turn on 3-rd party bulb control in yeelight app.

```ts
import {Yeelight, Storage} from 'yee-ts'

// Default usage (storage for device provide discovery)
async function foo() {
  const yee = new Yeelight(); // Create instance
  await yee.discover(); // Discover yeelight devices

  const device = yee.createDevice('ID') // Create device with bulb id
}

// Only light control (custom storage)
async function bar() {
  const yee = new Yeelight();
  const storage = new Storage([{
      id: 'bar',
      ip: '192.168.0.1'
    }])

  const device = yee.createDevice('bar', storage) // Create device with bulb id
}
```

## API
```ts
import { Yeelight, Storage } from 'yee-ts';

new Yeelight()
  .getDevice() // Reffer to Storage().getOne()
  .getDevices() // Reffer to Storage().getAll()
  .createDevice(): Device // Create new device connection

new Storage(storage?: IYeeDevice[])
  .getAll(): IYeeDevice[] | null // Get array of discovered devices or null
  .getOne(id: string): IYeeDevice | null // Get single device by id or null
  .updateAll(devices: IYeeDevice[]): IYeeDevice[] // Replace old storage with new

new Yeelight().createDevice(id: string, storage?: Storage, params?: IDeviceParams) // new Device()
  .getDevice(): IYeeDevice // Get device
  .updateStorage(device: IYeeDevice, wipe?: boolean) // Rewrites device old props with new, is wipe is true, will replace old storage with new. Ip and id is required.
  .updateParams(params: IDeviceParams) // Rewrites class props.
  .closeWriteSocket() // Close write socket
  .reconnectWriteSocket() // Reconnect write socket
  .closeListenSocket() // Close listen socket
  .reconnectListenSocket() // Reconnect listen socket
  . // Implemented all methods, to use bg_ set isBg in command to true. Except methods listed below. You can see all types in yee-ts/dist/types/Device.d.ts
```

### Device
```ts
const deviceDefaultParams: IDeviceParams = {
  writeTimeoutMs: 5000,
  writeSocketPort: 55439, // For reconnect it uses this port - 1
  listenSocketPort: 55429, // For reconnect it uses this port - 1
  listenSocketTimeout: 3600000
  defaultEffect: 'smooth',
  effectDuration: 300,
  defaultMode: 0,
  localIP: '192.168.0.1' // set the public ipv4 ip
  devCMD: false,
  forceTurnOn: false // Set power on if command requires it.
};
```

Excepted methods
```ts
method cron_get // Throws write socket timeout on W3 bulb. Use instead set_scene('auto_delay_off')
method get_prop // Throws write socket timeout on W3 bulb. Use instead get_prop() from storage
method set_music // W3 bulb not connecting to music server. Behaivour is not predictable, so method is not implemented.
```
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
// bright < 1 || bright > 100 = range error / true
brightCheckRange(bright: number)


// converts rgb to full number ((r * 65536) + (g * 256) + b)
rgbToFull(r: number, g: number, b: number)
```

## Events
```ts
// Device
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
Last update: 1.3.11<br>
unniiiverse 2023 