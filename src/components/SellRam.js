import React, { Component, Fragment } from 'react'
import { I18n } from 'react-redux-i18n'

import Input from 'components/Input'
import Button from 'components/Button'
import LoadingImage from 'components/LoadingImage'
import TransactionSuccess from 'components/TransactionSuccess'
import TransactionFailed from 'components/TransactionFailed'
import iost from 'iostJS/iost'
import ui from 'utils/ui'
import user from 'utils/user'

import './SellRam.scss'

type Props = {

}

class SellRam extends Component<Props> {
  state = {
    amount: 0,
    forWho: '',
    isShowAdvancedOption: false,
    isLoading: false,
  }

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    })
  }

  toggleShowAdvancedOption = () => {
    this.setState({
      isShowAdvancedOption: !this.state.isShowAdvancedOption,
      forWho: '',
    })
  }

  sellRam = async () => {
    const { amount, forWho } = this.state
    const ID = iost.account.getID()
    const activeAccount = await user.getActiveAccount()

    iost.sendTransaction('ram.iost', 'sell', [ID, forWho || ID, Number(amount)], activeAccount.network === 'LOCALNET' ? activeAccount.chainID : null)
      .onPending(() => {
        this.setState({
          isLoading: true,
        })
      })
      .onSuccess((response) => {
        this.setState({ isLoading: false })
        ui.openPopup({ content: <TransactionSuccess tx={response} /> })
      })
      .onFailed((err) => {
        this.setState({ isLoading: false })
        ui.openPopup({ content: <TransactionFailed tx={err} /> })
      })
  }

  render() {
    const { amount, isLoading, isShowAdvancedOption } = this.state
    const { ramMarketInfo } = this.props

    return !!ramMarketInfo && (
      <div className="SellRam">
        <p className="SellRam__description">1. {I18n.t('howManyBytesWillYouSell')}</p>
        <p className="SellRam__ramPrice">({I18n.t('currentSellRamPrice', { price: Number(ramMarketInfo.sell_price).toFixed(4) })})</p>
        <div className="SellRam__InputWrapper">
          <Input
            className="SellRam__Input"
            name="amount"
            onChange={this.handleChange}
          />
          <span className="SellRam__InputDescription">{I18n.t('bytes')}</span>
        </div>
        {!!amount && (
          <p className="SellRam__expectedPrice">
            = {(Number(amount) * Number(ramMarketInfo.sell_price)).toFixed(2)} IOST
          </p>
        )}
        {isShowAdvancedOption && (
          <Fragment>
            <p className="SellRam__description">
              2. {I18n.t('whichAccountWillGetSoldIost')}
            </p>
            <div className="SellRam__InputWrapper">
              <Input
                className="SellRam__Input"
                name="forWho"
                onChange={this.handleChange}
              />
            </div>
          </Fragment>
        )}
        <p
          className="SellRam__advancedOption"
          onClick={this.toggleShowAdvancedOption}
        >
          {isShowAdvancedOption ? 'Back to default option' : '+ advanced option'}
        </p>
        <Button className="SellRam__sellButton" onClick={this.sellRam}>Sell</Button>
        {isLoading && <LoadingImage />}
      </div>
    )
  }
}

export default SellRam
