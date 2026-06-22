import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../data/rules/armas');
const DEST_FILE = path.join(__dirname, '../data/rules/weapons_master.json');

// Recursive function to get all json files
function getAllJsonFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllJsonFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.json')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

console.log('Compiling modular JSON files into Master DB...');

const allFiles = getAllJsonFiles(SRC_DIR);
const masterDb: Record<string, any> = {};

let totalEntries = 0;
let totalAliasesMapped = 0;

allFiles.forEach(file => {
  const data = fs.readFileSync(file, 'utf-8');
  try {
    const jsonArray = JSON.parse(data);
    if (Array.isArray(jsonArray)) {
      jsonArray.forEach(weapon => {
        totalEntries++;
        // Map every alias as a direct key pointing to the weapon object
        // This provides O(1) lookup speed for the simulator parser
        if (Array.isArray(weapon.aliases)) {
          weapon.aliases.forEach(alias => {
            if (!masterDb[alias]) {
              masterDb[alias] = weapon;
              totalAliasesMapped++;
            }
          });
        } else {
          // Fallback if no aliases
          masterDb[weapon.item] = weapon;
          totalAliasesMapped++;
        }
      });
    }
  } catch (err) {
    console.error(`Error parsing ${file}:`, err);
  }
});

fs.writeFileSync(DEST_FILE, JSON.stringify(masterDb, null, 2), 'utf-8');

console.log(`Compilation complete!`);
console.log(`- Unique Modular Weapons processed: ${totalEntries}`);
console.log(`- Total Lookup Aliases generated: ${totalAliasesMapped}`);
console.log(`- Master file saved to: data/rules/weapons_master.json`);
