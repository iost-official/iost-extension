import bs58 from 'bs58'
import EC from 'elliptic';
import axios from 'axios'
import iost from 'iostJS/iost'
const secp = new EC.ec('secp256k1');

const Algorithm = {
  Ed25519: 2,
  Secp256k1: 1,
};

// export const privateKeyToPublicKey = (privateKey, algo) => {
//   const decodedPrivateKey = bs58.decode(privateKey).toString('hex')
//   const rawPublicKey = decodedPrivateKey.slice(decodedPrivateKey.length / 2)
//   const publicKey = bs58.encode(Buffer.from(rawPublicKey, 'hex'))
//   return publicKey
// }
export const privateKeyToPublicKey = (privateKey) => {
  const decodedPrivateKey = bs58.decode(privateKey);
  const edKP = new iost.pack.KeyPair(decodedPrivateKey, privateKey.length>50?Algorithm.Ed25519:Algorithm.Secp256k1);
  const publicKey = bs58.encode(Buffer.from(edKP.pubkey, 'hex'))
  return publicKey
}

// http://54.249.186.224
export const publickKeyToAccount = async (publickKey, isProd = true) => {
  const url = isProd ? 'https://explorer.iost.io/' : 'http://54.249.186.224/'
  try {
    const { data } = await axios.get(`${url}iost-api/accounts/${publickKey}`,{
      timeout: 10000
    })
    if(data.code == 0){
      return data.data.accounts || []
    }
  } catch (err) {
    console.log(err)
  }
  return []
  // throw new Error('Invlid publickKey');
}

// get local account
export const nameAndPublicKeyToAccount = async (name, publicKey, url) => {
  try {
    const { data } = await axios.get(`${url}/getAccount/${name}/1`,{
      timeout: 10000
    })
    let k = JSON.stringify(data.permissions);
    if(k.indexOf(publicKey)>-1){
      return data;
    } else {
      return [];
    }
  } catch (err) {
    console.log(err)
  }
  return []
}
