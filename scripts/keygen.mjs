import {generateKeyPairSync} from 'node:crypto';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const pair=generateKeyPairSync('ed25519');
await mkdir('secrets',{recursive:true,mode:0o700});
// Never overwrite an existing signing key.
await writeFile('secrets/signing-private.pem',pair.privateKey.export({type:'pkcs8',format:'pem'}),{flag:'wx',mode:0o600});
const file='src/license.ts';
const text=await readFile(file,'utf8');
if(!text.includes('PUBLIC_KEY_PENDING'))throw new Error('PUBLIC_KEY_ALREADY_CONFIGURED');
await writeFile(file,text.replace('PUBLIC_KEY_PENDING',pair.publicKey.export({type:'spki',format:'pem'}).trim()));
console.log('Signing key generated locally; private key was not printed. Public key embedded. Back up secrets securely.');
