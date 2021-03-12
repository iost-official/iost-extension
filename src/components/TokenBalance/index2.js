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

import './index.scss'

type Props = {

}



let tokenList = [
  {symbol: 'iost', asset: '1234.56788765'},
  {symbol: 'lol', asset: '1234.56788765'},
  {symbol: 'abct', asset: '1234.56788765'},
  {symbol: 'iet', asset: '1234.56788765'},
  {symbol: 'usdt', asset: '1234.56788765'},
  {symbol: 'btc', asset: '1234.56788765'},
  {symbol: 'eth', asset: '1234.56788765'},
  {symbol: 'trx', asset: '1234.56788765'},
]



class Index extends Component<Props> {
  state = {
    amount: 0,
    isLoading: true,
    isError: false
  }
  _isMounted = false

  componentDidMount() {
    this._isMounted = true
    this.getData()
  }

  getData = async () => {
    while(this._isMounted && !this.state.isError){
      await this.getResourceBalance(this.props)
      await utils.delay(5000)
    }
  }

  componentWillReceiveProps(nextProps) {
    this.getResourceBalance(nextProps)
  }
  

  componentWillUnmount() {
    this._isMounted = false
  }

  getTokenBalance = async () => {
    const { account, selectedTokenSymbol } = this.props
    const url = account.network == 'MAINNET'?'https://api.iost.io': account.network == 'LOCALNET' ? 'http://127.0.0.1:30001' :'https://test.api.iost.io';
    iost.changeNetwork(url)
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


  goToTokenDetail = () => {

  }



  render() {
    const { frozenAmount, amount, gas, gas_used, userGasInfo, ram, ram_used, isLoading } = this.state
    const { selectedTokenSymbol, account, moveTo } = this.props

    return <IOSTBalance {...this.state} {...this.props}/>
  }
}


const IOSTBalance = ({ frozenAmount, amount, gas, gas_used, userGasInfo, ram, ram_used, userRamInfo, isLoading, selectedTokenSymbol, account, moveTo }) => {
  const url = account?`${account.network == 'MAINNET'?'https://www.iostabc.com':account.network == 'LOCALNET' ? 'http://127.0.0.1:30001' :'http://54.249.186.224'}/account/${account.name}`:'#'
  
  return (
    <div className="TokenBalance-box">
      <a target={account?"_blank":''} href={url}>
        <div className="logo-box">
          <img className="logo" src="/static/images/logo.png" />
        </div>
        <div className="TokenBalance-amount-box">
          <span className="TokenBalance__amount">{isLoading ? <LoadingImage /> : amount}</span>
          <span className="TokenBalance__symbol">{selectedTokenSymbol}</span>
          {/*(frozenAmount !== 0) && <span className="TokenBalance__frozenBalance"> (+ {frozenAmount})</span>*/}
        </div>
      </a>

      {!isLoading && (
        <div className="TokenBalance__resources">
          <div className="progress-wrapper">
            <div className="progress-box" onClick={moveTo('/gasManage')}>
              <div className="ram-default">
                <span>iGAS</span>
                <span className="percent">{`${userGasInfo.limit?((1-userGasInfo.current_total/userGasInfo.limit)*100):0}%`}</span>
              </div>
              <div className="progress-wrap">
                <div className="progress-inner" style={{width: `${userGasInfo.limit ? Math.round((1-userGasInfo.current_total/userGasInfo.limit)*100):0}%`}}></div>
              </div>
            </div>

            <div className="progress-box" onClick={moveTo('/ramManage')}>
              <div className="ram-default">
                <span>iRAM</span>
                <span className="percent">{`${userRamInfo.total ? Math.round(userRamInfo.used/userRamInfo.total*100):0}%`}</span>
              </div>
              <div className="progress-wrap">
                <div className="progress-inner" style={{width: `${userRamInfo.total?userRamInfo.used/userRamInfo.total*100:0}%`}}></div>
              </div>
            </div>
          </div>


          <div className="coin-list-wrapper">
            {
              tokenList.map(item =>
                <div className="coin-box" key={item.symbol} onClick={this.goToTokenDetail}>
                  <div className="img-name">
                    <img className="coin-img" src={iconSrc[item.symbol]} alt=''/>
                    <span>{item.symbol.toUpperCase()}</span>
                  </div>
                  <span>{item.asset}</span>
                </div>
              )
            }
            <p className="add-token" onClick={moveTo('/assetManage')}><i />add Token</p>
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

const mapStateToProps = (state) => ({
  selectedTokenSymbol: state.token.selectedTokenSymbol,
})

export default connect(mapStateToProps)(Index)
