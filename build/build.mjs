// Required Packages
import fs from 'fs';
import path from 'path';
import {clean} from './clean.mjs';
import less from 'less';

// Source and destination folders
const sourceDirectory = path.join('./src','');
const targetDirectory = path.join('./dist','');

// Clean up 'dist' directory if it exists
clean(targetDirectory);

// A list of folders to ignore when we're copying files 1-to-1 (these are included in a different manner)
const ignoreDirList = ['less', 'packs'];

// Copy files to a new directory
fs.cpSync(sourceDirectory, targetDirectory, {
    recursive: true,
    filter: (file) => {
        const fileBits = file.split(path.sep).slice(-2);
        if (ignoreDirList.includes(fileBits[1]) && fileBits[0] === sourceDirectory) {
            return false;
        } else {
            return true;
        }
    }},
    (err) => {
    if (err) throw err;
    console.log('Copied!');
});

// Build less
const lessCode = fs.readFileSync(path.join(sourceDirectory, 'less', 'main.less'), 'utf8');
less.render(lessCode, {}, (e,output) => {
    if (!e) fs.writeFileSync(path.join(targetDirectory, 'main.css'), output.css);
});

console.log('All Done')