How to use for dapp?


### Installation using NPM

```javascript
npm i -S iost
```

### Using IWalletJS

```javascript
import IOST from 'iost'

IWalletJS.enable().then((account) => {
    if(!account) return; // not login

    const iost = IWalletJS.newIOST(IOST)

    //transfer
    const tx = iost.transfer('iost', account, "testnetiost", "1.000", "this is memo")
    
    iost.signAndSend(tx)
    .on('pending', (trx) => {
      console.log(trx, 'trx')
    })
    .on('success', (result) => {
      console.log(result, 'result')
    })
    .on('failed', (failed) => {
      console.log(failed, 'failed')
    })

    const ctx = iost.callABI('contractAddress', "hello", ['args']);

    iost.signAndSend(ctx)
    ...
})
```

## SignMessage

```js
// /^[1-9a-zA-Z]{1,11}$/
const message = "a123456AZ";

IWalletJS.enable().then((account) => {
    if(account){
        const iost = IWalletJS.newIOST(IOST)
        iost.signMessage(message)
            .on('pending', (pending) => {
                console.log(pending, 'pending')
                this.setState({
                    isLoading: true,
                    txHash: pending,
                    result: ''
                })
            })
            .on('success', (result) => {
              // {
              //      "algorithm": "xxx",
              //      "public_key": "xxx",
              //      "signature: "base64 format"
              //      "message": "message"
              // }
                this.setState({
                    isLoading: false,
                    result: JSON.stringify(result)
                })
            })
            .on('failed', (failed) => {
                console.log(failed, 'failed')
                this.setState({
                    isLoading: false,
                })
            })
    }else{
        console.log('not login')
    }
})
```

### How to verify the signature

The actual signed message is prefixed with 4 bytes big endian length. For example, using iwallet to sign 'lianwantang' is actually signing "\x00\x00\x00\x0blianwantang".  
After signing, you can check the signature like this:

#### Javascript

```
const Signature = require('iost.js').Signature;
const sigr = Signature.fromJSON(JSON.stringify({algorithm: "ED25519", public_key: "vrpJD/m2Jsl4fr3jjyQUwUD0mhd1t/jiV8qvqJnAH74=", signature: "ARbN/gXhpujahwlGxmaENbonVXqWLZJGhdiEEVkdBaa8rDkJtqxy1w3UUuqKRuGi/Ol1Winyn+FVDPpzOQe8Cg==", message: "lianwantang"}));
let messageRaw = "lianwantang";
let lenBuf = Buffer.alloc(4);
lenBuf.writeInt32BE(messageRaw.length, 0);
let messageFull = Buffer.concat([lenBuf, Buffer.from(messageRaw)])
console.log("Signature recover result: ", sigr.verify(messageFull));)
```

Golang

```
  import ""github.com/iost-official/go-iost/crypto"
  rawMessage := []byte("\x00\x00\x00\x0blianwantang")
  pubkeyBytes, err := base64.StdEncoding.DecodeString("vrpJD/m2Jsl4fr3jjyQUwUD0mhd1t/jiV8qvqJnAH74=")
  if err != nil {
   panic(err)
  }
  sigBytes, err := base64.StdEncoding.DecodeString("ARbN/gXhpujahwlGxmaENbonVXqWLZJGhdiEEVkdBaa8rDkJtqxy1w3UUuqKRuGi/Ol1Winyn+FVDPpzOQe8Cg==")
  if err != nil {
   panic(err)
  }
  sign :=&crypto.Signature{
   Algorithm: crypto.Ed25519,
   Sig:       sigBytes,
   Pubkey:    pubkeyBytes,
  }
  fmt.Println(sign.Verify(rawMessage))
```


## For Local Dapp Development

You can use the extension to communicate with local chains on your server. 

Go to `Settings` -> `About IOST Wallet` -> `Developer Mode`, and enable Developer Mode.

With the Developer Mode enabled, you are able to import accounts on local chains.

If you are importing local accounts, enter the account name you want to import, then provide endpoint and chainID information as well.
Those information will be tied to the account info and used when the account tries to communicate with the chain.

This feature is still experimental. Please report any bugs or unexpected behavoiurs. 





