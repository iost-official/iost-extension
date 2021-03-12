import * as userActions from 'actions/user'
// const IOST = require('../../../iost.js')
import store from '../store'
import user from 'utils/user'
import utils from 'utils'

const IOST = require('iost')
const bs58 = require('bs58')


class Callback {
  constructor() {
      this.map = {}
  }

  on(msg, f) {
      this.map[msg] = f;
      return this;
  }

  pushMsg(msg, args) {
      const f = this.map[msg];
      if (f === undefined) {
          return
      }
      f(args)
  }
}


const DEFAULT_IOST_CONFIG = {
  gasPrice: 100,
  gasLimit: 100000,
  delay: 0,
}

// const IOST_NODE_URL = 'http://localhost:30001'
const IOST_NODE_URL = 'https://api.iost.io'
const IOST_PROVIDER = new IOST.HTTPProvider(IOST_NODE_URL)

const iost = {
  pack: IOST,
  iost: new IOST.IOST(DEFAULT_IOST_CONFIG, IOST_PROVIDER),
  rpc: new IOST.RPC(IOST_PROVIDER),
  account: new IOST.Account('empty'),
  Tx: IOST.Tx,
  // network
  changeNetwork: (url) => {
    const newNetworkProvider = new IOST.HTTPProvider(url)
    iost.iost = new IOST.IOST(DEFAULT_IOST_CONFIG, newNetworkProvider)
    iost.rpc = new IOST.RPC(newNetworkProvider)
    iost.iost.setRPC(iost.rpc)
    chrome.runtime.sendMessage({
      action: 'CHANGE_NETWORK',
      payload: {
        url,
      }
    })
  },
  changeAccount: async (account) => {
    try {
      chrome.runtime.sendMessage({
        action: 'CHANGE_ACCOUNT',
        payload: account
      })
      iost.account = new IOST.Account(account.name)
      const password = await user.getLockPassword()
      const encodedPrivateKey = utils.aesDecrypt(account.privateKey, password)
      const kp = new IOST.KeyPair(bs58.decode(encodedPrivateKey),encodedPrivateKey.length>50?2:1)
      iost.account.addKeyPair(kp, "owner")
      iost.account.addKeyPair(kp, "active")
      iost.iost.setAccount(iost.account);
      // Redux dispatch
      store.dispatch(userActions.setUserInfo(account.name, kp.id))

    } catch (err) {
      console.log(err)
    }
  },
  // account
  loginAccount: (id, encodedPrivateKey) => {
    iost.account = new IOST.Account(id)
    const kp = new IOST.KeyPair(bs58.decode(encodedPrivateKey),encodedPrivateKey.length>50?2:1)
    iost.account.addKeyPair(kp, "owner")
    iost.account.addKeyPair(kp, "active")
    iost.iost.setAccount(iost.account);
    // Redux dispatch
    store.dispatch(userActions.setUserInfo(id, kp.id))

    // CHROME send message
    chrome.runtime.sendMessage({
      action: 'LOGIN_SUCCESS',
      payload: {
        id,
        encodedPrivateKey,
        publicKey: kp.id,
      }
    })
    return iost.account
  },
  logoutAccount: () => {
    // Redux dispatch
    store.dispatch(userActions.resetUserInfo())

    iost.account = new IOST.Account('empty')
    // CHROME send message
    chrome.runtime.sendMessage({
      action: 'LOGOUT_SUCCESS'
    })
  },
  isValidAccount: (accountInfo, publicKey) => {
    if (!accountInfo || !accountInfo.permissions) {
      return false
    }

    const permissions = accountInfo.permissions
    let foundKey = false
    Object
      .keys(permissions)
      .forEach((permissionName) => {
        permissions[permissionName].items.forEach(({ id }) => {
          if (id === publicKey) {
            foundKey = true
            return true
          }
        })
      })

    return foundKey
  },
  sendTransaction: (contractAddress, contractAction, args, chainID) => {
    const tx = iost.iost.callABI(contractAddress, contractAction, args)
    // tx.addApprove("*", "unlimited")
    tx.addApprove("iost", +args[2])

    let chainId = ((iost.rpc.getProvider()._host.indexOf('//api.iost.io') < 0) && (iost.rpc.getProvider()._host.indexOf('//127.0.0.1') < 0) && (iost.rpc.getProvider()._host.indexOf('//localhost') < 0)) ? 1023 : 1024;
    if (chainID) {
      chainId = chainID
    }
    tx.setChainID(chainId)

    iost.account.signTx(tx)

    const fire = {
      pending: () => {},
      success: () => {},
      failed: () => {},
    }

    const handler = new iost.pack.TxHandler(tx, iost.rpc)

    handler
      .onPending((pending) => {
        fire.pending(pending)
      })
      .onSuccess(async (response) => {
        fire.success(response)
      })
      .onFailed((err) => {
        fire.failed(err)
      })
      .send()
      .listen(1000, 60)

    return {
      onPending: (callback) => {
        fire.pending = callback
        return handler
      },
      onSuccess: (callback) => {
        fire.success = callback
        return handler
      },
      onFailed: (callback) => {
        fire.failed = callback
        return handler
      }
    }
  },
  signAndSend: (contractAddress, contractAction, args, presetAmountLimit, chainID) => {
    const tx = iost.iost.callABI(contractAddress, contractAction, args)
    
    if (presetAmountLimit) {
      tx.addApprove(presetAmountLimit[0], presetAmountLimit[1])
    } else {
      tx.addApprove("iost", +args[2])
    }

    let chainId = ((iost.rpc.getProvider()._host.indexOf('//api.iost.io') < 0) && (iost.rpc.getProvider()._host.indexOf('//127.0.0.1') < 0) && (iost.rpc.getProvider()._host.indexOf('//localhost') < 0)) ? 1023 : 1024;
    if (chainID) {
      chainId = chainID
    }
    tx.setChainID(chainId)

    const fire = new Callback()
    iost.iost.setAccount(iost.account);

    const handler = iost.iost.signAndSend(tx)
    let inverval = null
    handler.on('pending', (pending) => {
      fire.pushMsg("pending", pending)

      let times = 90
      inverval = setInterval(async () => {
        times--;
        if(times){
          iost.rpc.transaction.getTxByHash(pending)
          .then( data => {
            const tx_receipt = data.transaction.tx_receipt
            if(tx_receipt){
              clearInterval(inverval);
              if (tx_receipt.status_code === "SUCCESS") {
                fire.pushMsg("success", tx_receipt)
              } else {
                fire.pushMsg("failed", tx_receipt.stack?tx_receipt.message:tx_receipt)
              }
            }
          })
        }else {
          clearInterval(inverval);
          fire.pushMsg("failed", `Error: tx ${pending} on chain timeout.`)
        }
      },1000)
    })
    .on('failed', (err) => {
      clearInterval(inverval)
      console.log('failed: ', err)
      fire.pushMsg("failed", err.stack?err.message:err)
    })

    return fire



    // return {
    //   onPending: (callback) => {
    //     fire.pending = callback
    //     return handler
    //   },
    //   onSuccess: (callback) => {
    //     fire.success = callback
    //     return handler
    //   },
    //   onFailed: (callback) => {
    //     fire.failed = callback
    //     return handler
    //   }
    // }
  }
}

export default iost
