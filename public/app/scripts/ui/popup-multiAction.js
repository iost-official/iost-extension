import React, { Component } from 'react'
import classnames from 'classnames'
import Input from 'components/Input'
import './popup-multiAction.scss'

const i18n = {
  en: {
    "Transfer": "Transfer",
    "Contract": "Contract",
    "RequestTo": "To",
    "RequestAmount": "Amount",
    "RequestMemo": "Memo",
    "ActionX": "Action${X}",
    "XActionsNeedYouPermission": "action need your permission",
    "XActionsNeedYouPermissionS": "actions need your permission",
    "Dapp_iGasPrice": "iGas Price",
    "Dapp_iGasAmount": "Amount",
    "Dapp_ResourceFees": "Resource Fees",
    "Dapp_AmountLimitTips": "* Amount Limit is the maximum amount of consumable tokens in this transaction. Please authorize carefully.",
    "Dapp_From": "From",
    "Dapp_Account": "Account",
    "Dapp_AccountLimit": "Amount Limit",
    "Dapp_Authorization": "Authorization Requested",
    "Dapp_Signature": "Signature Requested",
    "Dapp_WhiteList": "Enable Whitelist",
    "Dapp_Cancel": "Cancel",
    "Dapp_Confirm": "Confirm",
    "Dapp_Tip1": "* Account authorization does not share your private key",
    "Dapp_Tip2": "* Current applications are developed by third parties, please pay attention to screening",
    "Dapp_Tip3": "* If you add this contract to the white-list, it will allow you to sign directly when you initiate the same contract request to the same beneficiary, manual operation will be no longer applied.",
    "Dapp_Message_Signature": "Message Signature Requested",
  },
  ko: {
    "Transfer": "트랜스퍼",
    "Contract": "계약",
    "RequestTo": "To",
    "RequestAmount": "수량",
    "RequestMemo": "Memo",
    "ActionX": "액션 ${X}",
    "XActionsNeedYouPermission": "가지 액션 권한이 필요합니다.",
    "XActionsNeedYouPermissionS": "가지 액션 권한이 필요합니다.",
    "Dapp_iGasPrice": "iGas 가격",
    "Dapp_iGasAmount": "수량",
    "Dapp_ResourceFees": "리소스 비용",
    "Dapp_AmountLimitTips": "* Amount Limit는 이 트랜잭션에서 소비 할 수있는 토큰의 최대량입니다. 신중하게 승인하십시오.",
    "Dapp_From": "From",
    "Dapp_Account": "계정",
    "Dapp_AccountLimit": "Amount Limit",
    "Dapp_Authorization": "승인 요청 됨",
    "Dapp_Signature": "서명 요청",
    "Dapp_WhiteList": "화이트리스트에 추가",
    "Dapp_Cancel": "취소",
    "Dapp_Confirm": "확인",
    "Dapp_Tip1": "* 계정 인증은 프라이빗 키를 공유하지 않습니다.",
    "Dapp_Tip2": "* 현재 응용 프로그램은 제 3 자에 의해 개발되었습니다. 스크리닝에 주의해 주세요.",
    "Dapp_Tip3": "* If you add this contract to the white-list, it will allow you to sign directly when you initiate the same contract request to the same beneficiary, manual operation will be no longer applied.",
    "Dapp_Message_Signature": "Message Signature Requested",
  },
  zh: {
    "Transfer": "转账",
    "Contract": "合约",
    "RequestTo": "To",
    "RequestAmount": "代币数量",
    "RequestMemo": "Memo",
    "ActionX": "操作${X}",
    "XActionsNeedYouPermission": "个操作需要您的许可",
    "XActionsNeedYouPermissionS": "个操作需要您的许可",
    "Dapp_iGasPrice": "iGas价格",
    "Dapp_iGasAmount": "数量",
    "Dapp_ResourceFees": "资源费用",
    "Dapp_AmountLimitTips": "* Amount Limit为本次交易最高可消耗代币数量, 请谨慎授权",
    "Dapp_From": "From",
    "Dapp_Account": "账号",
    "Dapp_AccountLimit": "Amount Limit",
    "Dapp_Authorization": "请求授权",
    "Dapp_Signature": "请求签名",
    "Dapp_WhiteList": "添加到白名单",
    "Dapp_Cancel": "取消",
    "Dapp_Confirm": "确认",
    "Dapp_Tip1": "* 账户授权并不会共享您的私钥",
    "Dapp_Tip2": "* 当前应用为第三方开发，请注意甄别",
    "Dapp_Tip3": "* 如您将这个合约加入白名单，代表您允许您的账号在同一网站发起同一合约请求给同一收款方的情况下，直接给予签名，而不再进行手动授权。",
    "Dapp_Message_Signature": "请求信息签名",
  },
}

const transLocal = (lan, name, ...args) => {
  let result = i18n[lan][name] || i18n.en[name] || i18n.zh[name]

  if (result && args.length) {
    result = result.replace(/\$\{.\}/g, [].shift.bind(args))
  }

  return result
}

const checkLan = (str) => ['en','zh','ko'].indexOf(str)> -1 ? str : null

const defaultLan = () => {
  let lang = navigator.language||navigator.userLanguage;
  lang = lang.substr(0, 2);
  return checkLan(lang) || 'en'
}

export default class extends Component {
  constructor() {
    super()
    this.hasClick = false

    this.state = {
      lang: defaultLan(),
      tx: null,
      isAddWhitelist: false,
      iGASPrice: 1,
      iGASLimit: 100000,
      showGasForm: false
    }

    try {
      if (performance.navigation.type === 1) {
        window.close()
      }
    } catch(e) {}

  }

  getTx = () => {
    chrome.runtime.sendMessage({
      action: 'FIND_TX_BY_IDX',
      idx: this.props.slotIdx
    }, tx => {
      this.setState({ tx })

      if (tx.tx.gasLimit) {
        this.setState({ iGASLimit: tx.tx.gasLimit })
      }

      if (tx.tx.gasRatio) {
        this.setState({ iGASPrice: tx.tx.gasRatio })
      }
    })
  }

  toggleWhiteList = () => {
    this.setState({
      isAddWhitelist: !this.state.isAddWhitelist
    })
  }

  cancelTx = () => {
    this.hasClick = true
    chrome.runtime.sendMessage({
      action: 'TX_CANCEL',
      payload: {
        slotIdx: this.props.slotIdx,
      }
    })
    window.close()
  }

  confirmTx = () => {
    this.hasClick = true
    chrome.runtime.sendMessage({
      action: 'TX_CONFIRM',
      payload: {
        slotIdx: this.props.slotIdx,
        isAddWhitelist: this.state.isAddWhitelist,
        iGASPrice: this.state.iGASPrice,
        iGASLimit: this.state.iGASLimit
      }
    })
    window.close()
  }

  toggleGasForm = () => {
    this.setState({
      showGasForm: !this.state.showGasForm,
    })
  }

  handleFormChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  componentDidMount() {
    this.getTx()

    chrome.storage.local.get(['locale'], ({locale}) => {
      if (locale) {
        this.setState({lang: locale})
      }
    })

    window.onbeforeunload = () => {
      if(!this.hasClick){
        this.cancelTx()
      }
    }
  }

  render() {
    if (!this.state.tx) {
      return null
    }
    const { lang, tx: transaction, isAddWhitelist, iGASLimit, iGASPrice, showGasForm } = this.state
    const { tx, account } = transaction
    const hasTransfer = tx.actions.some(act => act.actionName === 'transfer')
    const hasSignMessage = tx.actions.some(act => act.actionName === '@__SignMessage')

    return (
      <div className="multi-action">
        <div className="header">
            {
              hasSignMessage? null:
                  (<span
                      onClick={this.toggleWhiteList}
                      className={classnames('whitelist-btn', isAddWhitelist && 'active')}>
                      {transLocal(lang, 'Dapp_WhiteList')}
                  </span>)
            }
          {/*<span*/}
            {/*onClick={this.toggleWhiteList}*/}
            {/*className={classnames('whitelist-btn', isAddWhitelist && 'active')}>*/}
            {/*{transLocal(lang, 'Dapp_WhiteList')}*/}
          {/*</span>*/}
          <h1 className="title">{transLocal(lang, hasTransfer ? hasSignMessage?'Dapp_WhiteList':'Dapp_Signature' : 'Dapp_Authorization')}</h1>
          <p className="memo">{tx.actions.length} {transLocal(lang, tx.actions.length > 1 ? 'XActionsNeedYouPermissionS' : 'XActionsNeedYouPermission')}</p>
        </div>
        <div className="content">
          <section className="list">
            <ol>
              {hasSignMessage
                  ? null
                  :
                  tx.actions.map(act => (
                  <li key={act.contract}>{act.contract} <i className="arrow">-></i>  {act.actionName}</li>
                ))
              }
            </ol>
          </section>
          <div className="detail">
            <div className="item">
              <div className="item-tit">{transLocal(lang, hasTransfer ? `Dapp_From` : `Dapp_Account`)}</div>
              <p className="item-val">{account.name}</p>
            </div>
            <div className="item">
              <div className="item-tit">{transLocal(lang, 'Dapp_AccountLimit')}</div>
              <div className="item-val">
                {
                  tx.amount_limit.map(limit => (
                    <span className="account-limit-item" key={limit.token}>{limit.value} {limit.token}</span>
                  ))
                }
              </div>
              <div className="item-tips">{transLocal(lang, 'Dapp_AmountLimitTips')}</div>
            </div>
            {
              tx.actions.map((action, idx) => {
                const isTransfer = action.actionName === 'transfer'
                const [token, contract, _account, amount, memo] = JSON.parse(action.data)

                return (
                  <React.Fragment>
                    <div className="group-tit">{transLocal(lang, 'ActionX', idx+1)} - {transLocal(lang, isTransfer? 'Transfer': 'Contract')}</div>
                    {
                      isTransfer ? (
                          <div key={idx} className={classnames(isTransfer && 'item-group')}>
                            <div className="item">
                              <div className="item-tit">{transLocal(lang, 'RequestTo')}</div>
                              <p className="item-val">{_account}</p>
                            </div>
                            <div className="item">
                              <div className="item-tit">{transLocal(lang, 'RequestAmount')}</div>
                              <p className="item-val">{amount}</p>
                            </div>
                            <div className="item">
                              <div className="item-tit">{transLocal(lang, 'RequestMemo')}</div>
                              <p className="item-val" style={{ fontSize: 12 }}>{memo}</p>
                            </div>
                          </div>
                      ) : (
                        <div className="item">
                          <p className="item-val" style={{ fontSize: 12 }}>{action.data}</p>
                        </div>
                      )
                    }
                  </React.Fragment>
                )
              })
            }
          </div>
        </div>
        <div className="tips">
          <p>{transLocal(lang, 'Dapp_Tip1')}</p>
          <p>{transLocal(lang, 'Dapp_Tip2')}</p>
          <p>{transLocal(lang, 'Dapp_Tip3')}</p>
        </div>
        <div className="gas-setting">
          {
            !showGasForm && (
              <div className="transferAmount-box">
                <span className="transferAmount">{transLocal(lang, 'Dapp_ResourceFees')}</span>
                <span className="iGAS-price" onClick={this.toggleGasForm}>{iGASPrice} iGas <i /></span>
              </div>
            )
          }
          {
            showGasForm && (
              <div className="gas-form">
                <div className="back-btn" onClick={this.toggleGasForm}><i /></div>
                <div className="gas-form-item">
                  <span>{transLocal(lang, 'Dapp_iGasPrice')}</span>
                  <Input
                    name="iGASPrice"
                    value={iGASPrice}
                    autoFocus
                    onChange={this.handleFormChange}
                    className="input"
                  />
                </div>
                <div className="gas-form-item">
                  <span>{transLocal(lang, 'Dapp_iGasAmount')}</span>
                  <Input
                    name="iGASLimit"
                    value={iGASLimit}
                    onChange={this.handleFormChange}
                    className={classnames('input', 'iGASLimit')}
                  />
                </div>
              </div>
            )
          }
        </div>
        <div className="footer">
          <button
            className={classnames('ft-btn', isAddWhitelist && 'whitelist')}
            onClick={this.cancelTx}>{transLocal(lang, 'Dapp_Cancel')}</button>
          <button
            className={classnames('ft-btn', 'primary', isAddWhitelist && 'whitelist')}
            onClick={this.confirmTx}>{transLocal(lang, 'Dapp_Confirm')}</button>
        </div>
      </div>
    )
  }
}
