import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { I18n } from 'react-redux-i18n'
import { Header } from 'components'
import { Toast } from "components/index";
import Button from 'components/Button'
import './index.scss'
import iconSrc from "constants/icon";
import LoadingImage from "components/LoadingImage";
import cx from "classnames";
import Input from "components/Input";
import ui from "utils/ui";

import utils from 'utils'
import iost from 'iostJS/iost'
import user from 'utils/user'
import token, { getTokenInfo, defaultAssets } from "utils/token";


type Props = {

}

/**
 * assets = { ['account-network']: [{symbol:'',fullName: ''}]}
 */
class AssetManage extends Component<Props> {
  state = {
    loading: false,
    token: '',
    assetsList: []
  }

  componentDidMount() {
    this.getAssets()
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

  moveTo = (location) => () => {
    const { changeLocation } = this.props
    ui.settingLocation(location)
    changeLocation(location)
  }


  backTo = () => {
    const { changeLocation, locationList } = this.props
    ui.deleteLocation()
    const currentLocation = locationList[locationList.length - 1]
    changeLocation(currentLocation)
  }
  

  handleChange = (e) => {
    this.setState({
      token: e.target.value,
    })
  }

  goToTokenDetail = (selectSymbol) => () => {
    token.selectToken(selectSymbol)
    this.moveTo('/tokenDetail')()
  }

  onAddToken = async () => {
    let { token, assetsList } = this.state
    token = token.toLowerCase()
    if (!token.trim()) {
      return
    }
    
    const tempList = [...defaultAssets, ...assetsList]
    const result = tempList.some(item => item.symbol == token)
    // token已存在
    if (result) {
      Toast.html(I18n.t('AssetManage_AddExisted'))
      return
    }
    this.setState({
      loading: true
    })
    try {
      const account = await user.getActiveAccount()
      const _user = `${account.name}-${account.network}`
      // 未找到该币，会报错
      const data = await getTokenInfo(token, account)
      const assets = await utils.getStorage('assets', {})
      const asset = { symbol: token, fullName: data.full_name, onlyIssuerCanTransfer:data.only_issuer_can_transfer, issuer:data.issuer }
      assets[_user] = [...(assets[_user] || []), asset]
      await utils.setStorage('assets', assets)
      Toast.html(I18n.t('AssetManage_AddSuccess'))
      // 刷新资产
      this.getAssets()
    } catch (err) {
      Toast.html(I18n.t('AssetManage_AddNotFound'))
      console.log(err)
    }
    this.setState({
      loading: false
    })
  }



  render() {
    const { loading, assetsList, token } = this.state
    return (
      <Fragment>
        <Header title={I18n.t('Settings_assetManage')} onBack={this.backTo} hasSetting={false} />
        <div className="AssetManage-box">
          <label className="label">
            {I18n.t('Account_AddToken')}
          </label>
          <div className="input-box">
            <Input
              name="token"
              onChange={this.handleChange}
              placeholder={I18n.t('AssetManage_TokenName')}
              className="input"
            />
            <Button
              className="btn-add"
              onClick={this.onAddToken}
              disabled={token === ''}
            >
              { loading ? <LoadingImage /> : I18n.t('AssetManage_Add') }
            </Button>
          </div>

          <p className="asset-title">{I18n.t('AssetManage_MyAsset')}</p>
          <ul className="token-list-wrapper">
            {
              defaultAssets.map(item =>
                <li key={item.symbol} onClick={this.goToTokenDetail(item.symbol)}>
                  <img src={iconSrc[item.symbol] ? iconSrc[item.symbol] : iconSrc['default']} alt=""/>
                  <span>{`${item.symbol.toUpperCase()} (${item.fullName})`}</span>
                </li>
              )
            }
            {
              assetsList.map(item =>
                <li key={item.symbol} onClick={this.goToTokenDetail(item.symbol)}>
                  <img src={iconSrc[item.symbol] ? iconSrc[item.symbol] : iconSrc['default']} alt=""/>
                  <span>{`${item.symbol.toUpperCase()} (${item.fullName})`}</span>
                </li>
              )
            }
          </ul>

        </div>
      </Fragment>

    )
  }
}

const mapStateToProps = (state) => ({
  locationList: state.ui.locationList,
})

export default connect(mapStateToProps)(AssetManage)

