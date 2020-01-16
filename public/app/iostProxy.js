// const iost = require('iost')
const ACTION = require('./extensionActions')
const uuidv4 = require('uuid/v4');
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




const actionMap = {}

const callABI = ((actionId) => (...args) => {
  const txABI = args
  const message = {
    action: ACTION.TX_ASK,
    actionId,
    payload: txABI
  }

  const fire = {
    pending: () => {},
    success: () => {},
    failed: () => {},
  }

  const handler = {
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

  actionMap[actionId] = fire
  window.postMessage(message, '*')

  return handler
})(0)

const DEFAULT_IOST_CONFIG = {
  gasPrice: 100,
  gasLimit: 100000,
  delay: 0,
}

const IOST_NODE_URL = 'https://api.iost.io' //当前节点
const IOST_TEST_NODE_URL = 'https://test.api.iost.io' //当前节点
const IWalletJS = {
  newIOST: (IOST) => {
      IWalletJS.pack = IOST
      IWalletJS.iost = new IOST.IOST(DEFAULT_IOST_CONFIG);
      const IOST_PROVIDER = new IOST.HTTPProvider(IWalletJS.network == 'MAINNET'?IOST_NODE_URL: IOST_TEST_NODE_URL)
      IWalletJS.rpc = new IOST.RPC(IOST_PROVIDER)
      IWalletJS.iost.signAndSend = signAndSend
      IWalletJS.iost.signMessage = signMessage
      IWalletJS.iost.setRPC(IWalletJS.rpc)
      IWalletJS.iost.setAccount(IWalletJS.iost.account)
      IWalletJS.iost.account = new IOST.Account(IWalletJS.account.name)
      IWalletJS.iost.rpc = IWalletJS.rpc
      return IWalletJS.iost
  },
  enable: () => {
    //获取当前账号，后期可以改为账号选择
    return new Promise((resolve, reject) => {
      const invertal = setInterval(() => {
        if(IWalletJS.network){
          clearInterval(invertal)
          if(IWalletJS.iost){
            resolve(IWalletJS.iost.account._id)
          }else if(IWalletJS.account.name != null){
            resolve(IWalletJS.account.name)
          }else {
            reject({
              type: 'locked'
            })
          }
        }
      },100)
    })
  },

  setAccount: ({account, network}) => {
    IWalletJS.account = account
    IWalletJS.network = network
  },
}

window.postMessage({action: 'GET_ACCOUNT'}, '*')


function signAndSend(tx){
  const domain = document.domain
  const actionId = uuidv4()
  const cb = new Callback()
  const action = tx.actions[0]
  const network = this.currentRPC._provider._host.indexOf('//api.iost.io') > -1?'MAINNET':'TESTNET'
  const message = {
    action: ACTION.TX_ASK,
    actionId: actionId,
    payload: {
      tx,
      domain,
      account: IWalletJS.account,
      network,
      txABI: [action.contract, action.actionName, JSON.parse(action.data)]
    }
  }
  actionMap[actionId] = cb
  if(IWalletJS.account){
    window.postMessage(message, '*')
  }else {
    setTimeout(() => { cb.pushMsg("failed", 'no account') },0)
  }
  
  return cb
}

/**
 * 消息签名
 * @param message 待签名信息，文本
 */
function signMessage(message) {
    const cb = new Callback()

    if(typeof message !== 'string') {
        // throw new Error(`signMessage failure message must be String type`);
        setTimeout(() => {
            cb.pushMsg("failed", 'message must be String type')
        }, 0)
        return cb;
    }
    let regex = /^[1-9a-zA-Z]{1,11}$/;
    if (!regex.test(message)) {
        // throw new Error(`signMessage failure message must match '/^[1-9a-zA-Z]{12}$/'`);
        setTimeout(() => {
            cb.pushMsg("failed", 'message must be [1-9a-zA-Z], size less than 12')
        }, 0)
        return cb;
    }
    const fakeContract = "FakeContract";
    const signMessageActionName = "@__SignMessage";
    const mockIostTx = IWalletJS.iost.callABI("iost.sign", signMessageActionName, [message]);
    const domain = document.domain
    const actionId = uuidv4()

    const network = this.currentRPC._provider._host.indexOf('//api.iost.io') > -1 ? 'MAINNET' : 'TESTNET'
    const windowMessage = {
        action: ACTION.TX_ASK,
        actionId: actionId,
        payload: {
            tx: mockIostTx,
            domain,
            account: IWalletJS.account,
            network,
            txABI: [fakeContract, signMessageActionName, [message]]
        }
    }
    actionMap[actionId] = cb
    if (IWalletJS.account) {
        window.postMessage(windowMessage, '*')
    } else {
        setTimeout(() => {
            cb.pushMsg("failed", 'no account')
        }, 0)
    }
    return cb
}
// window.iost = IWalletJS

window.addEventListener('message', (e) => {
  if (e.source !== window) return
  const messageData = e.data && e.data.message
  if (messageData && messageData.actionId !== undefined) {
    const fire = actionMap[messageData.actionId]
    if(fire){
      if (messageData.pending) {
        fire.pushMsg("pending", messageData.pending)
        // fire.pending(messageData.pending)
      } else if (messageData.success) {
        fire.pushMsg("success", messageData.success)
        // fire.success(messageData.success)
        delete actionMap[messageData.actionId]
      } else if (messageData.failed) {
        fire.pushMsg("failed", messageData.failed)
        // fire.failed(messageData.failed)
        delete actionMap[messageData.actionId]
      }
    }else if(messageData.payload){
      IWalletJS.setAccount(messageData.payload)
    }
  }
 
})




module.exports = IWalletJS