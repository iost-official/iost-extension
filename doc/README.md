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