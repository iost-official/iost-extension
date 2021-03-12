import React, { Component } from 'react'
import { connect } from 'react-redux'
import { I18n } from 'react-redux-i18n'

import { Toast } from 'components'
import ResourceDetail from 'components/ResourceDetail'
import LoadingImage from 'components/LoadingImage'
import iost from 'iostJS/iost'
import { GET_TOKEN_BALANCE_INTERVAL } from 'constants/token'
import iconSrc from 'constants/icon'

import utils from 'utils'
import ui from "utils/ui";
import user from "utils/user";
import token, { defaultAssets } from 'utils/token'


import './index.scss'

type Props = {

}



class Index extends Component<Props> {
  state = {
    amount: 0,
    assetsList: [],
    isLoading: true,
    isError: false
  }
  _isMounted = false

  componentDidMount() {
    // 每次要重置为iost
    token.selectToken('iost')
    this._isMounted = true
    this.getData()
    this.getAssets()
  }

  getData = async () => {
    while(this._isMounted && !this.state.isError){
      await this.getResourceBalance(this.props)
      await utils.delay(5000)
    }
  }

  componentWillReceiveProps(nextProps) {
    this.getResourceBalance(nextProps)
    // 切换账号时，刷新资产
    this.getAssets()
  }
  

  componentWillUnmount() {
    this._isMounted = false
  }

  getTokenBalance = async () => {
    const { account, selectedTokenSymbol } = this.props
    iost.changeNetwork(utils.getNetWork(account))
    const { balance, frozen_balances } = await iost.rpc.blockchain.getBalance(iost.account.getID(), selectedTokenSymbol)

    let frozenAmount = 0

    if (frozen_balances && frozen_balances.length !== 0) {
      frozenAmount = frozen_balances.reduce((acc, cur) => (acc += cur.amount, acc), 0)
    }

    this.setState({
      amount: balance,
      frozenAmount,
      isLoading: false,
    })
  }

  getResourceBalance = (props) => {
    return new Promise( async (resolve, reject) => {
      const { account } = props
      try {
        iost.changeNetwork(utils.getNetWork(account))
        const { balance, frozen_balances, gas_info, ram_info } = await iost.rpc.blockchain.getAccountInfo(account.name)
        const frozenAmount = frozen_balances.reduce((prev, next) => (prev += next.amount, prev), 0)
        this.setState({
          amount: balance,
          frozenAmount,
          gas: gas_info.current_total,
          gas_used: Number((gas_info.limit - gas_info.current_total).toFixed(4)),
          userGasInfo: {
            current_total: gas_info.current_total,
            limit: gas_info.limit,
            pledged_info: gas_info.pledged_info
          },
          userRamInfo: {
            available: Number((ram_info.available/1024).toFixed(4)),
            total: Number((ram_info.total/1024).toFixed(4)),
            used: Number((ram_info.used/1024).toFixed(4)),
          },
          ram: Number((ram_info.available/1024).toFixed(4)),
          ram_used: Number((ram_info.used/1024).toFixed(4)),
          isLoading: false,
        })
        resolve()
      } catch (err) {
        
        resolve()
      }
      
    })
  }


  goToTokenDetail = (selectSymbol) => () => {
    token.selectToken(selectSymbol)
    this.props.moveTo('/tokenDetail')()
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



  render() {
    const { frozenAmount, amount, gas, gas_used, userGasInfo, userRamInfo, ram, ram_used, isLoading, assetsList } = this.state
    const { account, moveTo } = this.props

    const url = account?`${account.network == 'MAINNET'?'https://www.iostabc.com': account.network == 'LOCALNET'? account.endpoint || 'http://localhost:30001':'http://54.249.186.224'}/account/${account.name}`:'#'

    return (
      <div className="TokenBalance-box">
        <a target={account?"_blank":''} href={url}>
          <div className="logo-box">
            <img className="logo" src="/static/images/logo.png" />
          </div>
          <div className="TokenBalance-amount-box">
            <span className="TokenBalance__amount">{isLoading ? <LoadingImage /> : amount}</span>
            <span className="TokenBalance__symbol">IOST</span>
            {/*(frozenAmount !== 0) && <span className="TokenBalance__frozenBalance"> (+ {frozenAmount})</span>*/}
          </div>
        </a>

        {!isLoading && (
          <div className="TokenBalance__resources">
            <div className="progress-wrapper">
              <div className="progress-box" onClick={moveTo('/gasManage')}>
                <div className="ram-default">
                  <span>iGAS</span>
                  <span className="percent">{`${userGasInfo.limit ? Math.round(((1-userGasInfo.current_total/userGasInfo.limit)*10000))/100 : 0}%`}</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-inner" style={{width: `${userGasInfo.limit ? Math.round((1-userGasInfo.current_total/userGasInfo.limit)*100):0}%`}}></div>
                </div>
              </div>

              <div className="progress-box" onClick={moveTo('/ramManage')}>
                <div className="ram-default">
                  <span>iRAM</span>
                  <span className="percent">{`${userRamInfo.total ? Math.round(userRamInfo.used/userRamInfo.total*10000)/100 : 0}%`}</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-inner" style={{width: `${userRamInfo.total?userRamInfo.used/userRamInfo.total*100:0}%`}}></div>
                </div>
              </div>
            </div>


            <div className="coin-list-wrapper">
              {
                defaultAssets.map(item =>
                  <TokenContent symbol={item.symbol} key={item.symbol} account={account} goToTokenDetail={this.goToTokenDetail}/>
                )
              }

              {
                assetsList.map(item =>
                  <TokenContent symbol={item.symbol} key={item.symbol} account={account} goToTokenDetail={this.goToTokenDetail}/>
                )
              }

              <p className="add-token" onClick={moveTo('/assetManage')}><i />{I18n.t('Account_AddToken')}</p>
            </div>


            {/*<p className="TokenBalance__resources_manage">*/}
            {/*  <a onClick={moveTo('/gasManage')}>{I18n.t('GasManage_Title')}</a>*/}
            {/*  <a onClick={moveTo('/ramManage')}>{I18n.t('RamManage_Title')}</a>*/}
            {/*</p>*/}
          </div>
        )}
      </div>
    )

  }
}


class TokenContent extends Component<Props> {
  state = {
    isLoading: true,
    balance: 0,
  }

  interval = null

  componentDidMount() {
    this.getTokenBalance()
    this.interval = setInterval(() => {
      this.getTokenBalance()
    }, 5000)
  }

  componentWillReceiveProps(nextProps) {
    const { account } = this.props
    const { account: newAccount } = nextProps
    if(`${account.name}-${account.network}` != `${newAccount.name}-${newAccount.network}`){
      this.getTokenBalance()
    }
  }
  


  componentWillUnmount() {
    this.interval && clearInterval(this.interval)
  }


  getTokenBalance = async () => {
    const { symbol } = this.props
    const { balance } = await iost.rpc.blockchain.getBalance(iost.account.getID(), symbol)
    this.setState({
      isLoading: false,
      balance
    })
  }

  render(){
    const { balance, isLoading } = this.state
    const { symbol, goToTokenDetail } = this.props

    return(
      <div className="coin-box" onClick={goToTokenDetail(symbol)}>
        <div className="img-name">
          <img className="coin-img" src={iconSrc[symbol] ? iconSrc[symbol] : iconSrc['default']} alt=''/>
          <span>{symbol.toUpperCase()}</span>
        </div>
        <span>{isLoading ? <LoadingImage />: balance}</span>
      </div>
    )
  }
}



const mapStateToProps = (state) => ({
})

export default connect(mapStateToProps)(Index)
