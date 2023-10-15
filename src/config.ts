import process from 'node:process';

export const APIConfig = {
  host: '239.255.255.250',
  port: 1982
};

export const isDev = process.argv.some(el => el === 'devMode');