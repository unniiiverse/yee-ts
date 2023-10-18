# Yee-ts
Simple typescript implementation of yeelight [API Docs](https://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf)

## Compatibility
Package should work fine with all yeelight smart devices. Currently tested only with:
+ Yeelight Smart Bulb W3

If this package works fine with other yeelight devices, please notify me in issues.

## Usage
```ts
import {Yeelight, Storage} from 'yee-ts'

// Default usage
async function foo() {
  const yee = new Yeelight();
  await yee.discover() // Discover yeelight devices.

  const device = yee.createDevice('ID') // Create device with id
  device.toggle() // Use
}

// Only light control
async function bar() {
  const yee = new Yeelight();
  const storage = new Storage([{
      id: '123',
      ip: '192.168.0.1'
    }])

  const device = yee.createDevice('123', storage) // Create device with id
  device.toggle() // Use
}
```

## Available methods
| Method | Implemented | Param 1 | Param 2 | Param 3 | Param 4 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| get_prop | getProp | - | - | - | - |
| set_ct_abx | NONE | - | - | - | - |
| set_rgb | setRgb | CLAIMED | effect | duration | - |
| set_hsv | NONE | - | - | - | - |
| set_bright | setBright | CLAIMED | effect | duration | - |
| set_power | turnOn / turnOff | CLAIMED | effect | duration | mode |
| toggle | toggle | CLAIMED | effect | duration | mode |
| set_music | turnOnMusic / turnOffMusic | CLAIMED | - | - | - |
| - | NONE | - | - | - | - |

## API
```ts
import { Yeelight, Storage } from 'yee-ts'
new Yeelight()
  .getDevice(id: string): IYeeDevice // Get single device
  .getDevices(): IYeeDevice[] // Get list of devices
  .createDevice(): Device // Create new device connection

new Storage(props?: IYeeDevice[])
  .getAll() // Similar to getDevices in Yeelight
  .getOne() // Similar to getDevice in Yeelight
  .updateAll(devices: IYeeDevice[])

new Yeelight().createDevice()
  .getDevice() // Get device props
  . // Listed in available methods
```

## Events
```ts
// FEATURE IS IN DEV
```

## Downloads
Package also available on NPM
```
npm i yee-ts
```

## Contributions
Contributions are currently closed (until i write test cases)

### Dev notes
If SSDP does not work, try to off IGMP in your router. Also SSDP might work not properly, idk how fix that, maybe it bug in windows. Just take it, pc reload can help.