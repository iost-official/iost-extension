import crypto from 'crypto';


const utils = {
  aesEncrypt(data, key){
    const cipher = crypto.createCipher('aes192', key);
    var crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  },
  aesDecrypt(encrypted, key){
    const decipher = crypto.createDecipher('aes192', key);
    var decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
  encrypt(data, key){
    const endata = JSON.stringify(data)
    const cipher = crypto.createCipher('aes192', key);
    let crypted = cipher.update(endata, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  },
  decrypt(encrypted, key){
    const decipher = crypto.createDecipher('aes192', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  },
  delay(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  getNetWork(account){
    if (account.network === 'LOCALNET') {
      return account.endpoint
    }
    return account.network == 'MAINNET' ? 'https://api.iost.io' : 'https://test.api.iost.io'
  },
  getStorage(key, defaultValue) {
    return new Promise(resolve => (
      chrome.storage.local.get(key, data => resolve(data[key] || defaultValue || false))
    ));
  },
  setStorage(key, value){
    return new Promise(resolve => (
      chrome.storage.local.set({[key]: value}, resolve)
    ))
  },
}




// var data = 'Hello, this is a secret message!';
// var key = 'Password!';
// var encrypted = utils.aesEncrypt(data, key);
// var decrypted = utils.aesDecrypt(encrypted, key);
 
// console.log('Plain text: ' + data);
// console.log('Encrypted text: ' + encrypted);
// console.log('Decrypted text: ' + decrypted);


export default utils
