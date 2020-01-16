const iostController = require('./IostController')
const uuidv4 = require('uuid/v4');
const crypto = require('crypto')

const Signature = require('iost/lib/crypto/signature');
const IOST = require('iost')
const bs58 = require('bs58')
const Codec = require('iost/lib/crypto/codec');

const getStorage = (name, defvalue) => new Promise((resolve, reject) => {
  chrome.storage.local.get([name], (result) => {
    resolve(result[name] || defvalue)
  })
})

const IOST_NODE_URL = 'https://api.iost.io' //当前节点
const IOST_TEST_NODE_URL = 'https://test.api.iost.io'

function TxController(state) {
  this.state = state
  this.txQueue = []
  this.port = new Map()
  chrome.runtime.onConnect.addListener( (port) => {
    // this.port = port
    const name = `${port.name}_${uuidv4()}`
    // console.log('connect: ' + name)
    this.port.set(name, port)

    port.onDisconnect.addListener(() => {
      // console.log('disconnect: '+ name)
      this.port.delete(name);
    })
  })
}

TxController.prototype.findByIdx = function(idx) {
  return this.txQueue[idx]
}

TxController.prototype.addTx = function(txInfo) {
  this.txQueue.push(txInfo)
  return this.txQueue.length
}

TxController.prototype.processTx = async function(txIdx, isAddWhitelist, iGASPrice, iGASLimit) {
  const txInfo = this.txQueue[txIdx]
  if (!txInfo) throw new Error(`That TX does not exist. slotIdx: ${txIdx}`)

  const signMessageActionName = "@__SignMessage";

  const { tx: _tx, txABI, actionId, account, network, domain } = txInfo
  const [ contract, actionName, memo ] = txABI
  if(isAddWhitelist && signMessageActionName !== actionName){
    let whitelist = await getStorage('whitelist', [])
    let _to = contract
    if(actionName == 'transfer'){
      _to = memo[2]
    }
    whitelist.push({
      network,
      domain,
      account: account.name,
      contract,
      action: actionName,
      to: _to
    })

    const hash = {}
    whitelist = whitelist.reduce((prev, next) => {
      const _h = `${network}_${next.domain}_${next.account}_${next.contract}_${next.action}_${next.to}`
      hash[_h] ? '' : hash[_h] = true && prev.push(next);
      return prev
    },[]);
    chrome.storage.local.set({whitelist: whitelist})
  }

  const accounts = await getStorage('accounts', [])
  if(accounts.length){
    const acc = accounts.find(item => item.name == account.name && item.network == network)
    if(acc){
      const encodedPrivateKey = aesDecrypt(acc.privateKey, this.state.password)
      await iostController.changeNetwork(network == 'MAINNET'?IOST_NODE_URL: IOST_TEST_NODE_URL)
      iostController.loginAccount(account.name, encodedPrivateKey)
      const tx = new iostController.pack.Tx()
      Object.keys(_tx).map(key => tx[key] = _tx[key])
      if(network != 'MAINNET'){
        tx.setChainID(1023)
      }

      if (iGASPrice) {
        tx.gasRatio = +iGASPrice
      }

      if (iGASLimit) {
        tx.gasLimit = +iGASLimit
      }

      // tx.addApprove("*", "unlimited")
      // _tx.amount_limit.map(item => tx.addApprove(item.token, item.value))
      // if (txABI[1] === 'transfer') {
      //   tx.addApprove("iost", txABI[2][3])
      // }

      if (signMessageActionName === actionName) {
          const waitSignMessage = memo[0];
          let regex = /^[1-9a-zA-Z]{1,11}$/;
          if (!regex.test(waitSignMessage)) {
              this.port.forEach((port) => {
                  port.postMessage({
                      actionId: actionId,
                      failed: `signMessage failure message must match '/^[1-9a-zA-Z]{12}$/'`
                  });
              })
              return;
          }
          try {
              const kp = new IOST.KeyPair(bs58.decode(encodedPrivateKey),encodedPrivateKey.length>50?2:1)
              let codec = new Codec();
              codec.pushString(waitSignMessage);
              let waitSignMessageBinary = codec._buf;
              const iostSignature = new Signature(waitSignMessageBinary, kp);
              // {
              //      "algorithm": "xxx",
              //      "public_key": "xxx",
              //      "signature: "base64 format"
              //      "message": "message"
              // }
              const signatureResult = iostSignature.toJSON();
              signatureResult['message'] = waitSignMessage;
              this.port.forEach((port) => {
                  port.postMessage({
                      actionId: actionId,
                      success: signatureResult
                  });
              })
          } catch (error) {
              this.port.forEach((port) => {
                  port.postMessage({
                      actionId: actionId,
                      failed: `signMessage failure error: ${error.message}`
                  });
              })
          }
          return;
      }

      const handler = iostController.iost.signAndSend(tx)
      let inverval = null
      // console.log('start')
      handler
      .on('pending', (pending) => {
        // console.log('pending',pending)
        this.port.forEach((port) => {
          port.postMessage({
            actionId,
            pending: pending
          });
        })
        let times = 90
        inverval = setInterval(async () => {
          times--;
          if(times){
            iostController.rpc.transaction.getTxByHash(pending)
            .then( data => {
              const tx_receipt = data.transaction.tx_receipt
              if(tx_receipt){
                clearInterval(inverval);
                if (tx_receipt.status_code === "SUCCESS") {
                  // console.log('successBy: ', tx_receipt)
                  this.port.forEach((port) => {
                    port.postMessage({
                      actionId,
                      success: tx_receipt
                    });
                  })
                } else {
                  // console.log('failedBy: ', tx_receipt)
                  this.port.forEach((port) => {
                    port.postMessage({
                      actionId,
                      failed: tx_receipt.stack?tx_receipt.message:tx_receipt
                    });
                  })
                }
              }
            })
          }else {
            clearInterval(inverval);
            this.port.forEach((port) => {
              port.postMessage({
                actionId,
                failed: `Error: tx ${pending} on chain timeout.`
              });
            })
          }
        },1000)
      })
      .on('failed', (err) => {
        clearInterval(inverval)
        console.log('failed: ', err)
        this.port.forEach((port) => {
          port.postMessage({
            actionId,
            failed: err.stack?err.message:err
          });
        })
      })
    }else {
      //not find account
      this.port.forEach((port) => {
        port.postMessage({
          actionId: txInfo.actionId,
          failed: `User does not login or not exist. slotIdx: ${txIdx}`
        });
      })
    }
  }else {
    //not find account
    this.port.forEach((port) => {
      port.postMessage({
        actionId: txInfo.actionId,
        failed: `User does not exist. slotIdx: ${txIdx}`
      });
    })
  }

  // const tx = iostController.iostInstance.callABI(...txObject)
  // if(iostController.network.indexOf('//api.iost.io') < 0){
  //   tx.setChainID(1023)
  // }
  // // 交易的机器本地时间不能比节点的时间提前超过1秒，此处-3秒防止本地时间不对
  // tx.time = tx.time - 3 * 1e9
  // tx.addApprove("*", "unlimited")

  // if (txObject[1] === 'transfer') {
  //   tx.addApprove("iost", txObject[2][3])
  // }

  // // 2. Sign on transfer tx
  // iostController.account.signTx(tx)

  // // 3. Handle transfer tx
  // const handler = new iostController.pack.TxHandler(tx, iostController.rpc)

  // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //   const activeTab = tabs[0].id
  //   handler
  //     .onPending((pending) => {
  //       console.log(actionId, pending)
  //       chrome.tabs.sendMessage(activeTab, {
  //         actionId,
  //         pending: pending
  //       })
  //     })
  //     .onSuccess(async (response) => {
  //       console.log(actionId, response)
  //       chrome.tabs.sendMessage(activeTab, {
  //         actionId,
  //         success: response
  //       })
  //     })
  //     .onFailed((err) => {
  //       console.log(actionId, err)
  //       chrome.tabs.sendMessage(activeTab, {
  //         actionId,
  //         failed: err
  //       })
  //     })
  //     .send()
  //     .listen(1000, 60)
  // })

  this.txQueue.splice(txIdx, 1)
}

TxController.prototype.cancelTx = function(txIdx) {
  const txInfo = this.txQueue[txIdx]

  if(txInfo){
    this.port.forEach((port) => {
      port.postMessage({
        actionId: txInfo.actionId,
        failed: 'User rejected the signature request'
      });
    })
    // setTimeout(() => {
    //   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //     const activeTab = tabs[0].id
    //     chrome.tabs.sendMessage(activeTab, {
    //       actionId: txInfo.actionId,
    //       failed: 'User rejected the signature request'
    //     })
    //   })
    // },200)
  }
  if (!txInfo) throw new Error(`That TX is not exist. slotIdx: ${txIdx}`)
  this.txQueue.splice(txIdx, 1)
}

function aesDecrypt(encrypted, key){
  const decipher = crypto.createDecipher('aes192', key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


module.exports = TxController
