export { Yeelight } from './Yeelight.js';

//*

import { Yeelight } from './Yeelight.js';

(async function () {
  const inst = new Yeelight();
  await inst.discover();

  // 0x000000001c01864a
  const device = inst.createDevice('0x000000001c01864a');


})();