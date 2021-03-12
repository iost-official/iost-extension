import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { I18n } from 'react-redux-i18n'

import Input from 'components/Input'
import { Header, Toast, LoadingImage } from 'components'
import Button from 'components/Button'
import classnames from 'classnames'

import iost from 'iostJS/iost'
import store from '../../store'
import * as userActions from 'actions/user'
import { privateKeyToPublicKey } from 'utils/key'
import utils from 'utils'

import ui from "utils/ui";
import user from "utils/user";
import './index.scss'

type Props = {

}

class RamManage extends Component<Props> {
  state = {
    buyAmount: '',
    sellAmount: '',
    resourceAddress: '',
    isLoading: false,
    isBuy: true,
    ramMarketInfo: {
      buy_price: 0,
      sell_price: 0
    },
    userRamInfo: {
      available: 0,
      total: 0,
      used: 0,
    }
  }
  _isMounted = false


  componentDidMount() {
    ui.settingLocation('/RamManage')
    this._isMounted = true
    this.getData()
  }

  getData = async () => {
    while(this._isMounted){
      await this.getRAMInfo()
      await this.getUserRamInfo()
      await utils.delay(5000)
    }
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  getRAMInfo = () => {
    return new Promise((resolve, reject) => {
      iost.rpc.getProvider().send('get', 'getRAMInfo')
      .then(ramMarketInfo => {
        this.setState({
          ramMarketInfo,
        })
        resolve()
      })
      .catch(err => {
        resolve()
      })
    })
  }

  getUserRamInfo = () => {
    return new Promise((resolve, reject) => {
      iost.rpc.blockchain.getAccountInfo(iost.account.getID())
      .then(data => {
        const { available, total, used } = data.ram_info
        this.setState({
          userRamInfo: {
            available: Number((available/1024).toFixed(4)),
            total: Number((total/1024).toFixed(4)),
            used: Number((used/1024).toFixed(4)),
          }
        })
        resolve()
      })
      .catch(err => {
        resolve()
      })
    })
  }

  moveTo = (location) => () => {
    const { changeLocation } = this.props
    changeLocation(location)
  }


  onToggleDeal = (isBuy) => () => {
    this.setState({
      isBuy
    })
  }


  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    })
  }

  onSubmit = async () => {
    const { isBuy, buyAmount,sellAmount, resourceAddress, ramMarketInfo  } = this.state
    const account = iost.account.getID()
    const activeAccount = await user.getActiveAccount()

    if(isBuy){
      const _buyAmount = parseInt(buyAmount * 1024)
      const ramPrice = (ramMarketInfo.buy_price*1024).toFixed(4)
      const amountLimit = ['iost', (+ramPrice+1) * (+buyAmount)]

      iost.signAndSend('ram.iost', 'buy', [account, resourceAddress || account, _buyAmount], amountLimit, activeAccount.network === 'LOCALNET' ? activeAccount.chainID : null)
      .on('pending', () => {
        this.setState({
          isLoading: true,
        })
      })
      .on('success', (response) => {
        this.setState({ isLoading: false })
        ui.settingTransferInfo(response)
        this.moveTo('/tokenTransferSuccess')()
      })
      .on('failed', (err) => {
        this.setState({ isLoading: false })
        ui.settingTransferInfo(err)
        this.moveTo('/tokenTransferFailed')()
      })
    }else {
      const _sellAmount = parseInt(sellAmount*1024)
      // const ramPrice = (ramMarketInfo.sell_price*1024).toFixed(4)
      const amountLimit = ['ram', _sellAmount]
      // return console.log(amountLimit)
      
      iost.signAndSend('ram.iost', 'sell', [account, account, _sellAmount], amountLimit, activeAccount.network === 'LOCALNET' ? activeAccount.chainID : null)
      .on('pending', () => {
        this.setState({
          isLoading: true,
        })
      })
      .on('success', (response) => {
        this.setState({ isLoading: false })
        ui.settingTransferInfo(response)
        this.moveTo('/tokenTransferSuccess')()
      })
      .on('failed', (err) => {
        this.setState({ isLoading: false })
        ui.settingTransferInfo(err)
        this.moveTo('/tokenTransferFailed')()
      })
    }
  }


  render() {
    const { isBuy, buyAmount, sellAmount, resourceAddress, userRamInfo, ramMarketInfo, isLoading } = this.state
    const percent = userRamInfo.total?userRamInfo.used/userRamInfo.total*100:0
    return (
      <Fragment>
        <Header title={I18n.t('RamManage_Title')} onBack={this.moveTo('/account')} hasSetting={false} />
        <div className="ramManage-box">
          <div className="progress-box">
            <div className="ram-default">
              <span>iRAM</span>
              <span>{userRamInfo.total} KB</span>
            </div>
            <div className="progress-wrap">
              <div className="progress-inner" style={{width: `${percent}%`}}></div>
            </div>
            <div className="ram-used">
              <span>{I18n.t('RamManage_Used')}: {userRamInfo.used}KB</span>
              <span>{I18n.t('RamManage_Remaining')}: {userRamInfo.available}KB</span>
            </div>
          </div>

          <div className="content-box">
            <div className="toggle-title">
              <span className={classnames("toggle-buy", isBuy ? 'active': '')} onClick={this.onToggleDeal(true)}>{I18n.t('RamManage_Buy')}</span>
              <span className={classnames("toggle-sell", isBuy ? '' : 'active')} onClick={this.onToggleDeal(false)}>{I18n.t('RamManage_Sell')}</span>
            </div>
            <div className="toggle-box">
              <div className={classnames("buy-box", isBuy ? 'active': '')}>
                <div className="buy-title">
                  <span className="buy-amount">{I18n.t('RamManage_PurchaseAmount')}</span>
                  <span className="buy-price">{I18n.t('RamManage_PurchasePrice')}: {(ramMarketInfo.buy_price*1024).toFixed(4)} IOST/KB</span>
                </div>
                <Input name="buyAmount" value={buyAmount} placeholder={I18n.t('RamManage_PurchaseEnter')} onChange={this.handleChange} className="input-buyAmount" />
                <p className="equal-iost">{`=${(buyAmount*ramMarketInfo.buy_price*1024).toFixed(4)} IOST`}</p>

                <span className="address-title">{I18n.t('RamManage_Address')}</span>
                <Input name="resourceAddress" value={resourceAddress} placeholder={I18n.t('RamManage_Optional')} onChange={this.handleChange} className="input-address" />
              </div>

              <div className={classnames("seal-box", isBuy ? '': 'active')}>
                <div className="buy-title">
                  <span className="buy-amount">{I18n.t('RamManage_SellAmount')}</span>
                  <span className="buy-price">{I18n.t('RamManage_SellPrice')}: {(ramMarketInfo.sell_price*1024).toFixed(4)} IOST/KB</span>
                </div>
                <Input name="sellAmount" value={sellAmount} placeholder={I18n.t('RamManage_SellEnter')} onChange={this.handleChange} className="input-buyAmount" />
                <p className="equal-iost">{`=${(sellAmount*ramMarketInfo.sell_price*1024).toFixed(4)} IOST`}</p>
              </div>
            </div>
            <Button className="ram-btn-submit" onClick={this.onSubmit} disabled={isBuy?Number(buyAmount)<=0:Number(sellAmount)<=0}>{isLoading?<LoadingImage />:I18n.t('Transfer_Submit')}</Button>
          </div>
        </div>
      </Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  locationList: state.ui.locationList,
})

export default connect(mapStateToProps)(RamManage)
