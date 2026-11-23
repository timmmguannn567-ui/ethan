import {cp,mkdir,writeFile,rm} from 'node:fs/promises';
await rm(new URL('../docs',import.meta.url),{recursive:true,force:true});
await mkdir(new URL('../docs',import.meta.url),{recursive:true});
await cp(new URL('../dist',import.meta.url),new URL('../docs',import.meta.url),{recursive:true});
await writeFile(new URL('../docs/.nojekyll',import.meta.url),'');
await cp(new URL('../docs/index.html',import.meta.url),new URL('../docs/birthday.html',import.meta.url));
console.log('GitHub Pages package ready: docs/ (birthday.html included)');
