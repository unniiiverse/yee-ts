export { Yeelight } from './Yeelight.js';

//*

import { Yeelight } from './Yeelight.js';

(async function () {
  const inst = new Yeelight();

  console.log(await inst.discover());
})();