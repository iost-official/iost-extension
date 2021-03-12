import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { I18n } from 'react-redux-i18n'
import cx from 'classnames'

import iost from 'iostJS/iost'
import { Header } from 'components'
import Input from 'components/Input'
import Button from 'components/Button'
// import TokenBalance from 'components/TokenBalance'
import { GET_TOKEN_BALANCE_INTERVAL } from 'constants/token'
import TokenTransferSuccess from 'components/TokenTransferSuccess'
import TokenTransferFailed from 'components/TokenTransferFailed'
import ui from 'utils/ui'
import utils from 'utils'
import user from "utils/user";
import token, { defaultAssets } from 'utils/token'

import LoadingImage from 'components/LoadingImage'

import './index.scss'
import iconSrc from "constants/icon";

const defaultConfig = {
  gasRatio: 1,
  gasLimit: 100000,
  delay: 0,
  expiration: 90,
  defaultLimit: "unlimited"
}

type Props = {

}

class Index extends Component<Props> {
  constructor(props){
    super(props)
    this.state = {
      to: '',
      amount: 0,
      memo: '',
      token: props.selectedTokenSymbol,
      assetsList: [],
      isSending: false,
      balance: '-',
      iGASPrice: defaultConfig.gasRatio,
      iGASLimit: defaultConfig.gasLimit,
      errorMessage: '',
      isShowing: false, // 是否显示多余资源输入框
      isShowTokenList: false, // 是否显示token列表
    }
  }

  _isMounted = false

  componentDidMount() {
    this._isMounted = true
    this.getData()
    this.getAssets()
  }

  getData = async () => {
    while(this._isMounted){
      await this.getResourceBalance()
      await utils.delay(5000)
    }
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  // getTokenBalance = async () => {
  //   const { selectedTokenSymbol } = this.props
  //   const { balance, frozen_balances } = await iost.rpc.blockchain.getBalance(iost.account.getID(), selectedTokenSymbol)
  //
  //   let frozenAmount = 0
  //
  //   if (frozen_balances && frozen_balances.length !== 0) {
  //     frozenAmount = frozen_balances.reduce((acc, cur) => (acc += cur.amount, acc), 0)
  //   }
  //
  //   this.setState({
  //     balance: balance,
  //     frozenAmount,
  //     isLoading: false,
  //   })
  // }

  getResourceBalance = () => {
    return new Promise((resolve, reject) => {
      iost.rpc.blockchain.getAccountInfo(iost.account.getID())
      .then(({ balance, frozen_balances, gas_info, ram_info}) => {
        const frozenAmount = frozen_balances.reduce((prev, next) => (prev += next.amount, prev), 0)
        this.setState({
          frozenAmount,
          gas: gas_info.current_total,
          ram: ram_info.available,
          isLoading: false,
        })
        resolve()
      })
      .catch(err => {
        resolve()
      })
    })
  }

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
      errorMessage: '',
    })
  }

  transfer = async () => {
    const { to, amount, iGASPrice, iGASLimit, memo, token, assetsList } = this.state
    const { selectedTokenSymbol } = this.props
    const accountName = iost.account.getID()
    const activeAccount = await user.getActiveAccount()

    // 1. Create transfer tx
    // const tx = new iost.Tx(iGASPrice, iGASLimit, 0)
    // tx.addAction(
    //   'token.iost',
    //   'transfer',
    //   JSON.stringify([selectedTokenSymbol, accountName, to, amount, memo]),
    // )
    // tx.setTime(defaultConfig.expiration, defaultConfig.delay, 0)
    let chainId = ((iost.rpc.getProvider()._host.indexOf('//api.iost.io') < 0) && (iost.rpc.getProvider()._host.indexOf('//127.0.0.1') < 0) && (iost.rpc.getProvider()._host.indexOf('//localhost') < 0)) ? 1023 : 1024;
    if (activeAccount.network === 'LOCALNET') {
      chainId = activeAccount.chainID
    }

    const asset = defaultAssets.concat(assetsList).find(item => item.symbol === token)
    let contract = this.getAssetContract(asset)
    if(chainId === 1023 && token === 'husd') {
      contract = "ContractaTTuzpKVGHPUMdojrM88LG8DaWsdN7L1ncnpzQsA4aF"
    }
    const tx = iost.iost.callABI(contract, 'transfer', [token, accountName, to, amount, memo])

    tx.setChainID(chainId)

    // tx.addApprove("*", defaultConfig.defaultLimit)
    tx.addApprove(token, +amount)

    if (iGASPrice) {
      tx.gasRatio = +iGASPrice
    }

    if (iGASLimit) {
      tx.gasLimit = +iGASLimit
    }


    // const tx = iost.iost.transfer(selectedTokenSymbol, accountName, to, amount)

    // 2. Sign on transfer tx
    // iost.account.signTx(tx)
    
    iost.iost.setAccount(iost.account);
    
    const handler = iost.iost.signAndSend(tx)
    // console.log('handler:', handler)

    // iost.signAndSend(tx)
    //   .on('pending', (response) => {
    //     console.log(response)
    //   })
    //   .on('success', (response) => {
    //     console.log(response)
    //   })
    //   .on('failed', (response) => {
    //     console.log(response)
    //   })

    // 3. Handle transfer tx
    // const handler = new iost.pack.TxHandler(tx, iost.rpc)

    this.setState({ isSending: true })
    handler.on('pending', (res) => {
      // .onPending(async (res) => {
        let times = 90
        const inverval = setInterval(async () => {
          times--;
          if(times){
            iost.rpc.transaction.getTxByHash(res)
            .then( data => {
              const tx_receipt = data.transaction.tx_receipt
              if(tx_receipt){
                clearInterval(inverval);
                if (tx_receipt.status_code === "SUCCESS") {
                  this.setState({ isSending: false })
                  ui.settingTransferInfo(tx_receipt)
                  this.moveTo('/tokenTransferSuccess')()
                } else {
                  if (typeof tx_receipt === 'string') {
                    this.setState({
                      isSending: false,
                      errorMessage: typeof tx_receipt === 'string' && tx_receipt,
                    })
                  } else {
                    this.setState({
                      isSending: false,
                    })
                    ui.settingTransferInfo(tx_receipt)
                    this.moveTo('/tokenTransferFailed')()
                  }
                }
              }
            })
          }else {
            clearInterval(inverval);
            this.port.postMessage({
              actionId,
              failed: `Error: tx ${res.hash} on chain timeout.`
            });
          }
        },1000)
      })
      // .onSuccess(async (response) => {
      //   // clearInterval(intervalID)
      //   this.setState({ isSending: false })
      //   ui.settingTransferInfo(response)
      //   this.moveTo('/tokenTransferSuccess')()
      //   // ui.openPopup({
      //   //   content: <TokenTransferSuccess tx={response} />
      //   // })
      // })
      .on('failed', (err) => {
        // clearInterval(intervalID)
        if (typeof err === 'string') {
          this.setState({
            isSending: false,
            errorMessage: typeof err === 'string' && err,
          })
        } else {
          this.setState({
            isSending: false,
          })
          ui.settingTransferInfo(err)
          this.moveTo('/tokenTransferFailed')()
          // ui.openPopup({
          //   content: <TokenTransferFailed tx={err} />
          // })
        }
      })
      // .send()
      // .listen(1000, 60)
  }

  moveTo = (location) => () => {
    const { changeLocation } = this.props
    changeLocation(location)
  }

  backTo = () => {
    const { changeLocation, locationList } = this.props
    ui.deleteLocation()
    const currentLocation = locationList[locationList.length - 1]
    changeLocation(currentLocation)
  }


  toggleMenu = () => {
    this.setState({
      isShowing: !this.state.isShowing,
    })
  }


  toggleTokenList = (symbol, balance) => {
    this.setState({
      token: symbol,
      balance,
      isShowTokenList: false
    })
  }


  toggleToken = () => {
    this.setState({
      isShowTokenList: !this.state.isShowTokenList
    })
  }

  getAssets = () => {
    Promise.all([
      utils.getStorage('assets'),
      user.getActiveAccount()
    ]).then(([assetsList, account]) => {
      if(assetsList){
        this.setState({
          assetsList: assetsList[`${account.name}-${account.network}`] || []
        })
      }
    })
  }

  getAssetContract(asset) {
    if (typeof asset != "undefined" && asset.onlyIssuerCanTransfer && asset.issuer.startsWith("Contract")) {
      return  asset.issuer;
    }
    return 'token.iost';
  }

  render() {
    const { isSending, iGASPrice, iGASLimit, errorMessage, isShowing, balance, isShowTokenList, token, assetsList } = this.state
    const { selectedTokenSymbol } = this.props
    return (
      <Fragment>
        <Header title={I18n.t('Account_Transfer')} onBack={this.backTo} hasSetting={false} />
        <div className="tokenTransfer-box">
          <div className="choose-token-box">
            <label className="label">
              {I18n.t('Transfer_Choose')}
            </label>
            <Input
              name="token"
              onChange={this.handleChange}
              value={token.toUpperCase()}
              className="input"
              readOnly
              onClick={this.toggleToken}
            />
            <i className={cx("icon-arrow", isShowTokenList ? "active" : '')} onClick={this.toggleToken}/>
            <ul className={cx("token-list", isShowTokenList ? "active" : '')}>
              {
                defaultAssets.map(item => <li key={item.symbol}><TokenContent symbol={item.symbol} token={token} toggleTokenList={this.toggleTokenList}/></li>)
              }
              {
                assetsList.map(item => <li key={item.symbol}><TokenContent symbol={item.symbol} token={token} toggleTokenList={this.toggleTokenList}/></li>)
              }
            </ul>
          </div>


          <div className="transferAmount-box">
            <span className="transferAmount">{I18n.t('Transfer_Amount')}</span>
            <span className="balance">{I18n.t('Transfer_Balance', { num: balance, token })}</span>
          </div>
          <Input
            name="amount"
            onChange={this.handleChange}
            placeholder={I18n.t('Transfer_InputAmount')}
            className="input"
          />

          <label className="label">
            {I18n.t('Transfer_Payee')}
          </label>
          <Input
            name="to"
            onChange={this.handleChange}
            placeholder={I18n.t('Transfer_EnterName')}
            className="input"
          />
          <label className="label">
            {I18n.t('Transfer_Note')}
          </label>
          <Input
            name="memo"
            onChange={this.handleChange}
            placeholder={I18n.t('Transfer_Optional')}
            className="input"
          />

          <div className="transferAmount-box">
            <span className="transferAmount">{I18n.t('Transfer_Resource')}</span>
            <span className="iGAS-price" onClick={this.toggleMenu}>{iGASPrice} iGas <i /></span>
          </div>
          {
            isShowing && (
              <div>
                <Input
                  name="iGASPrice"
                  value={iGASPrice}
                  onChange={this.handleChange}
                  className="input"
                />
                <Input
                  name="iGASLimit"
                  value={iGASLimit}
                  onChange={this.handleChange}
                  className={cx('input', 'iGASLimit')}
                />
              </div>
            )
          }
          <div className="btn-box">
            <Button
              className="btn-submit"
              onClick={this.transfer}
            >
              {isSending ? <LoadingImage /> : I18n.t('Transfer_Submit')}
            </Button>
            {/* <p className="transferTips">{I18n.t('Transfer_Tip')}</p> */}
          </div>
          <p className="TokenTransfer__errorMessage">{errorMessage}</p>
        </div>
      </Fragment>
    )
  }
}


class TokenContent extends Component<Props> {
  state = {
    isLoading: false,
    balance: 0,
  }

  componentDidMount() {
    this.getTokenBalance()
  }


  getTokenBalance = async () => {
    const { symbol, token } = this.props
    this.setState({
      isLoading: true
    })
    const { balance } = await iost.rpc.blockchain.getBalance(iost.account.getID(), symbol)
    this.setState({
      isLoading: false,
      balance
    })

    if (symbol == token) {
      this.props.toggleTokenList(symbol, balance)
    }
  }

  onSelect = () => {
    const { symbol } = this.props
    const { balance } = this.state
    this.props.toggleTokenList(symbol, balance)
  }

  render(){
    const { balance, isLoading } = this.state
    const { symbol } = this.props

    return <span onClick={this.onSelect} className="token-item">{symbol.toUpperCase()} ({isLoading ? '-' : balance})</span>
  }
}




const mapStateToProps = (state) => ({
  locationList: state.ui.locationList,
  selectedTokenSymbol: state.token.selectedTokenSymbol,
})

export default connect(mapStateToProps)(Index)
