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

## Available methods
| Method | Implemented | Param 1 | Param 2 | Param 3 | Param 4 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| get_prop | getProp (Takes data from storage, not bulb) | - | - | - | - |
| set_ct_abx | setCtAbx | CLAIMED(ct) | effect | duration | - |
| set_rgb | setRgb | CLAIMED(rgb) | effect | duration | - |
| set_hsv | setHsv | CLAIMED(hue) | CLAIMED(sat) | effect | duration |
| set_bright | setBright | CLAIMED(bright) | effect | duration | - |
| set_power | turnOn / turnOff | CLAIMED(on/off) | effect | duration | mode |
| toggle | toggle | - | - | - | - |
| set_default | setDefault | - | - | - | - |
| start_cf | startCf | CLAIMED(count) | CLAIMED(action) | CLAIMED(flow) | - |
| stop_cf | stopCf | - | - | - | - |
| set_scene | setScene | CLAIMED(class) | - | - | - |
| cron_add | NONE | - | - | - | - |
| cron_get | NONE | - | - | - | - |
| cron_del | NONE | - | - | - | - |
| set_adjust | NONE | - | - | - | - |
| set_music | NONE | - | - | - | - |
| set_name | NONE | - | - | - | - |
| bg_set_rgb | NONE | - | - | - | - |
| bg_set_hsv | NONE | - | - | - | - |
| bg_set_ct_abx | NONE | - | - | - | - |
| bg_start_cf | NONE | - | - | - | - |
| bg_stop_cf | NONE | - | - | - | - |
| bg_set_scene | NONE | - | - | - | - |
| bg_set_default | NONE | - | - | - | - |
| bg_set_power | NONE | - | - | - | - |
| bg_set_bright | NONE | - | - | - | - |
| bg_set_adjust | NONE | - | - | - | - |
| bg_toggle | NONE | - | - | - | - |
| dev_toggle | NONE | - | - | - | - |
| adjust_bright | NONE | - | - | - | - |
| adjust_ct | NONE | - | - | - | - |
| adjust_color | NONE | - | - | - | - |
| bg_adjust_bright | NONE | - | - | - | - |
| bg_adjust_ct | NONE | - | - | - | - |

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

## Events
```ts
interface IDeviceEmitter {
  response: (data: { method: string, params: { [attr: string]: any } }, device: IYeeDevice) => void
}
```

## Downloads
Package also available on NPM
```
npm i yee-ts
```

## Contributions
Contributions are open. Tests exec in src/ by 
```
npm run test
```
Tests written only for storage for now. 

<hr>

License: MIT <br>
Last update: 1.1.2 <br>
unniiiverse 2023 