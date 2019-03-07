import fs from 'fs';
import path from 'path';
export default class File {
    static getContent(url,filePath) {
        return fs.readFileSync(path.join(path.dirname(url.replace('file://','')),filePath)).toString();
    }
}