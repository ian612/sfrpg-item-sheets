// Required Packages
import fs from 'fs';
import path from 'path';

export function clean(targetDirectory) {
    if (fs.existsSync(targetDirectory)) {
        fs.rmSync(targetDirectory, {recursive: true});
    }
}

/*if (esMain(import.meta)) {
    clean(path.join('./dist', ''));
} */