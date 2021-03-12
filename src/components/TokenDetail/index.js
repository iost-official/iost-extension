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
import ui from "utils/ui";
import iost from "iostJS/iost";
import token, {getTokenInfo} from "utils/token";
import utils from "utils/index";
import user from "utils/user";


type Props = {

}

class TokenDetail extends Component<Props> {
  state = {
    isLoading: true,
    balance: 0,
    fullName: '',
  }

  interval = null

  componentDidMount() {
    this.getTokenBalance()
    this.interval = setInterval(() => {
      this.getTokenBalance()
    }, 5000)
  }


  componentWillUnmount() {
    this.interval && clearInterval(this.interval)
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

  getTokenBalance = async () => {
    const { selectedTokenSymbol } = this.props
    const account = await user.getActiveAccount()
    Promise.all([
      iost.rpc.blockchain.getBalance(iost.account.getID(), selectedTokenSymbol),
      getTokenInfo(selectedTokenSymbol, account)
    ]).then(([balance, fullName]) => {
      this.setState({
        isLoading: false,
        balance: balance.balance,
        fullName: fullName.full_name
      })
    }).catch((err) => {
      console.log(err)
      this.setState({
        isLoading: false,
      })
    })
  }


  render() {
    const { selectedTokenSymbol } = this.props
    const { balance, fullName, isLoading } = this.state
    return (
      <Fragment>
        <Header title={selectedTokenSymbol.toUpperCase()} onBack={this.backTo} hasSetting={false} />
        <div className="TokenDetail-box">
          <div className="logo-box">
            <img className="logo" src={iconSrc[selectedTokenSymbol] ? iconSrc[selectedTokenSymbol] : iconSrc['default']} alt=''/>
          </div>
          <div className="amount-box">
            <span className="amount">{isLoading ? <LoadingImage /> : balance}</span>
            <span>{selectedTokenSymbol}</span>
          </div>
          <p className="token-fullName">{I18n.t('TokenDetail_Full')} {fullName}</p>
          <a className="view-detail" href={`https://www.iostabc.com/token/${selectedTokenSymbol}`} target="_blank">{I18n.t('TokenDetail_Detail')}</a>

          <div className="btn-box">
            <Button
              className="btn-account"
              onClick={this.moveTo('/tokenTransfer')}
            >
              {I18n.t('Account_Transfer')}
            </Button>
            <Button
              className="btn-receipt btn-account"
              onClick={this.moveTo('/accountQRCode')}
            >
              {I18n.t('Account_Receive')}
            </Button>
          </div>
        </div>
      </Fragment>

    )
  }
}

const mapStateToProps = (state) => ({
  locationList: state.ui.locationList,
  selectedTokenSymbol: state.token.selectedTokenSymbol,
})

export default connect(mapStateToProps)(TokenDetail)

