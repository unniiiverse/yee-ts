import FileHound from 'filehound';
import fs from 'fs';
import path from 'path';

const files = FileHound.create()
  .paths(path.resolve() + '/dist')
  .ext(['js', 'ts', 'd.ts'])
  .find();


files.then((filePaths) => {

  filePaths.forEach((filepath) => {
    fs.readFile(filepath, 'utf8', (err, data) => {
      if (!data.match(/import .* from/g) && !data.match(/export .* from/g)) {
        return;
      }

      const nd1 = data.replace(/(import .* from\s+['"])(\.\/[^.'"]+)(?=['"])/g, '$1$2.js');
      const newData = nd1.replace(/(export .* from\s+['"])(\.\/[^.'"]+)(?=['"])/g, '$1$2.js');
      if (err) throw err;

      console.log(`writing to ${filepath}`);
      fs.writeFile(filepath, newData, function (err) {
        if (err) {
          throw err;
        }
        console.log('complete');
      });
    });
  });
});