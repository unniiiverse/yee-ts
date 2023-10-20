import process from 'node:process';

export const isDev = process.argv.some(el => el === 'devMode');