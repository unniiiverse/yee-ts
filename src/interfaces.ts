import net from 'node:net';

export type TYeeDeviceModel = 'colorb' | string;
export type TYeeDeviceColorMode = 1 | 2 | 3;
export type TYeeDeviceProps = 'id' | 'ip' | 'port' | 'model' | 'power' | 'bright' | 'color_mode' | 'ct' | 'rgb' | 'hue' | 'sat' | 'name'

export interface IYeeDevice {
  id: string,
  ip: string,
  port?: number,
  model?: TYeeDeviceModel,
  power?: boolean,
  bright?: number,
  color_mode?: TYeeDeviceColorMode,
  ct?: number,
  rgb?: number,
  hue?: number,
  sat?: number,
  name?: string,
  fw?: number,
  flow_params?: string,
  flowing?: boolean,
  musicMode?: boolean,
  delayOff?: number
}

export interface IMusicServer {
  server: net.Server,
  host: string,
  port: number
}

export interface IColorFlow {
  duration: number,
  mode: 1 | 2 | 7,
  value: number,
  brightness: number
}


export type TDeviceEffect = 'smooth' | 'sudden';

interface IDeviceDefault {
  isBg?: boolean,
  isTest?: boolean,
  effect?: TDeviceEffect,
  duration?: number,
}

export interface IDeviceSetCtAbx extends IDeviceDefault {
  ct: number,
}

export interface IDeviceSetRgb extends IDeviceDefault {
  full?: number,
  r?: number,
  g?: number,
  b?: number,
}

export interface IDeviceSetHsv extends IDeviceDefault {
  hue: number,
  sat: number
}

export interface IDeviceSetBright extends IDeviceDefault {
  bright: number,
}