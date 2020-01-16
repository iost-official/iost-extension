import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import MultiAction from './popup-multiAction'
// import i18n from './i18n'
// import AskPopupSummary from './popup-summary'
// import AskPopupDetail from './popup-detail'

import './popup-index.scss'

const i18n = {
  en: {
    "Dapp_Unlock": "Unlock Now",
    "Dapp_Authorization": "Authorization Requested",
    "Dapp_Tip1": "* Account authorization does not share your private key",
    "Dapp_Tip2": "* Current applications are developed by third parties, please pay attention to screening",
    "Dapp_Signature": "Signature Requested",
    "Dapp_WhiteList": "Enable Whitelist",
    "Dapp_Cancel": "Cancel",
    "Dapp_Confirm": "Confirm",
    "Dapp_Tip3": "* If you add this contract to the white-list, it will allow you to sign directly when you initiate the same contract request to the same beneficiary, manual operation will be no longer applied.",
    "Dapp_Message_Signature": "Message Signature Requested",
  },
  ko: {
    "Dapp_Unlock": "지금 잠금해제하기",
    "Dapp_Authorization": "승인 요청 됨",
    "Dapp_Tip1": "* 계정 인증은 프라이빗 키를 공유하지 않습니다.",
    "Dapp_Tip2": "* 현재 응용 프로그램은 제 3 자에 의해 개발되었습니다. 스크리닝에 주의해 주세요.",
    "Dapp_Signature": "서명 요청",
    "Dapp_WhiteList": "화이트리스트에 추가",
    "Dapp_Cancel": "취소",
    "Dapp_Confirm": "확인",
    "Dapp_Tip3": "* If you add this contract to the white-list, it will allow you to sign directly when you initiate the same contract request to the same beneficiary, manual operation will be no longer applied.",
    "Dapp_Message_Signature": "Message Signature Requested",
  },
  zh: {
    "Dapp_Unlock": "立即解锁",
    "Dapp_Authorization": "请求授权",
    "Dapp_Tip1": "* 账户授权并不会共享您的私钥",
    "Dapp_Tip2": "* 当前应用为第三方开发，请注意甄别",
    "Dapp_Signature": "请求签名",
    "Dapp_WhiteList": "添加到白名单",
    "Dapp_Cancel": "取消",
    "Dapp_Confirm": "确认",
    "Dapp_Tip3": "* 如您将这个合约加入白名单，代表您允许您的账号在同一网站发起同一合约请求给同一收款方的情况下，直接给予签名，而不再进行手动授权。",
    "Dapp_Message_Signature": "请求信息签名",
  },
}

const transLocal = (lan, name) => {
  return i18n[lan][name]
}
type Props = {

}

//contract method
//chrome-extension://mjkppkibbpmmkokkhgjhlipgokonagep/askTx.html?slotIdx=0&tx=%5B%22ContractEf4ztxHFP4iUs6Xpomgb2nqfJN3D9K7dfp5H7pV7BVy4%22%2C%22hello%22%2C%5B%22123%22%5D%5D

//transfer
// chrome-extension://mjkppkibbpmmkokkhgjhlipgokonagep/askTx.html?slotIdx=0&tx=%5B%22token.iost%22%2C%22transfer%22%2C%5B%22iost%22%2C%22testnetiost%22%2C%22testiost1%22%2C%221.000%22%2C%22%22%5D%5D

class AskPopup extends Component<Props> {
  constructor() {
    super()
    this.state = {
      lan: 'en',
      isAddWhitelist: false
    }
    window.location.search
      .replace('?', '')
      .split('&')
      .forEach(a => {
        const [key, value] = a.split('=')
        this[key] = value
      }) // this.slotIdx, this.tx
    try {
      this.txInfo = JSON.parse(decodeURIComponent(this.tx))
    } catch (e) {
      this.txInfo = []
    }
    this.hasClick = false

  }

  componentDidMount() {
    chrome.storage.local.get(['locale'], ({locale}) => {
      if(locale){
        this.setState({
          lan: locale
        })
      }
    })
    // chrome.windows.onRemoved.addListener((integer windowId) => {
    //   chrome.runtime.sendMessage({
    //     action: 'TX_CANCEL',
    //     payload: {
    //       slotIdx: this.slotIdx,
    //     }
    //   })
    // });
    // window.onbeforeunload = () => {
    //   if(!this.hasClick){
    //     this.cancelTx()
    //   }
    // }
  }

  confirmTx = () => {
    this.hasClick = true
    chrome.runtime.sendMessage({
      action: 'TX_CONFIRM',
      payload: {
        slotIdx: this.slotIdx,
        isAddWhitelist: this.state.isAddWhitelist
      }
    })
    window.close()
  }

  cancelTx = () => {
    this.hasClick = true
    chrome.runtime.sendMessage({
      action: 'TX_CANCEL',
      payload: {
        slotIdx: this.slotIdx,
      }
    })
    window.close()
  }

  onTransLocal = (name) => {
    return transLocal(this.state.lan, name)
  }

  onToggleWhiteList = () => {
    this.setState({
      isAddWhitelist: !this.state.isAddWhitelist
    })
  }

  render() {
    const { isAddWhitelist } = this.state
    const [contractAddress, abi, args = []] = this.txInfo
    const hasSignMessage = abi === '@__SignMessage';
    return (
      <MultiAction txInfo={this.txInfo} slotIdx={this.slotIdx}/>
    )
    return (
      <div className="AskPopup">
        <header className="AskPopup__header">
          <p className="title">{abi == 'transfer' ? this.onTransLocal('Dapp_Signature') : hasSignMessage ?  this.onTransLocal('Dapp_WhiteList'): this.onTransLocal('Dapp_Authorization')}</p>
          {
              hasSignMessage
                  ?(<p><span>{this.onTransLocal('Dapp_Message_Signature')}</span></p>)
                  :(<p><span>{contractAddress}</span><span>-></span><span>{abi}</span></p>)
          }
            {
                hasSignMessage? null:(<span class={isAddWhitelist?'active':''} onClick={this.onToggleWhiteList}>  {this.onTransLocal('Dapp_WhiteList')}</span>)
            }
          {/*<span class={isAddWhitelist?'active':''} onClick={this.onToggleWhiteList}>  {this.onTransLocal('Dapp_WhiteList')}</span>*/}
        </header>
        <div className="AskPopup__container">
          {abi == 'transfer'?
          <TransferDetail
          args={args}
          />:<ContractDetail
          accountId={this.accountId}
          args={args}
          />}
          {/*
            <AskPopupDetail
            contractAddress={contractAddress}
            abi={abi}
            args={args}
          />
          <AskPopupSummary
            contractAddress={contractAddress}
            abi={abi}
            args={args}
          />
          <p className="AskPopup__confirmMessage">Are you sure to confirm this transaction?</p>
          */}
          <p className="AskPopup__tip">{this.onTransLocal('Dapp_Tip1')}</p>
          <p className="AskPopup__tip">{this.onTransLocal('Dapp_Tip2')}</p>
          <p className="AskPopup__tip">{this.onTransLocal('Dapp_Tip3')}</p>
          <div className={`AskPopup__buttons ${isAddWhitelist?'active':''}`}>
            <button
              onClick={this.cancelTx}
            >
              {this.onTransLocal('Dapp_Cancel')}
            </button>
            <button
              onClick={this.confirmTx}
            >
              {this.onTransLocal('Dapp_Confirm')}
            </button>
          </div>
        </div>

      </div>
    )
  }
}

const ContractDetail = ({args, accountId}) => {
  return (
    <div className="AskPopup__detail">
      <span className="title">Account</span>
      <p>{accountId}</p>
      <span className="title">Memo</span>
      <p className="memo">{JSON.stringify(args,null,4)}</p>
    </div>
  )
}

const TransferDetail = ({args}) => {
  const [symbol, _from, to, amount, memo] = args
  return (
    <div className="AskPopup__detail">
      <span className="title">From</span>
      <p>{_from}</p>
      <span className="title">To</span>
      <p>{to}</p>
      <span className="title">Amount</span>
      <p className="amount">{`${amount} ${symbol}`}</p>
      <span className="title">Memo</span>
      <p className="memo">{memo}</p>
    </div>
  )
}









ReactDOM.render(<AskPopup />, document.getElementById('root'))
