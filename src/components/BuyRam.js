import React, { Component, Fragment } from 'react'
import { I18n } from 'react-redux-i18n'

import ui from 'utils/ui'
import user from 'utils/user'
import Input from 'components/Input'
import Button from 'components/Button'
import LoadingImage from 'components/LoadingImage'
import TransactionSuccess from 'components/TransactionSuccess'
import TransactionFailed from 'components/TransactionFailed'
import iost from 'iostJS/iost'

import './BuyRam.scss'

type Props = {

}

class BuyRam extends Component<Props> {
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

  buyRam = async () => {
    const { amount, forWho } = this.state
    const ID = iost.account.getID()
    const activeAccount = await user.getActiveAccount()

    iost.sendTransaction('ram.iost', 'buy', [ID, forWho || ID, Number(amount)], activeAccount.network === 'LOCALNET' ? activeAccount.chainID : null)
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
      <div className="BuyRam">
        <p className="BuyRam__description">1. {I18n.t('howManyBytesWillYouBuy')}</p>
        <p className="BuyRam__ramPrice">({I18n.t('currentBuyRamPrice', { price: Number(ramMarketInfo.buy_price).toFixed(4) })})</p>
        <div className="BuyRam__InputWrapper">
          <Input
            className="BuyRam__Input"
            name="amount"
            onChange={this.handleChange}
          />
          <span className="BuyRam__InputDescription">{I18n.t('bytes')}</span>
        </div>
        {!!amount && (
          <p className="BuyRam__expectedPrice">
            = {(Number(amount) * Number(ramMarketInfo.buy_price)).toFixed(2)} IOST
          </p>
        )}
        {isShowAdvancedOption && (
          <Fragment>
            <p className="BuyRam__description">
              2. {I18n.t('whichAccountWillGetBoughtRAM')}
            </p>
            <div className="BuyRam__InputWrapper">
              <Input
                className="BuyRam__Input"
                name="forWho"
                onChange={this.handleChange}
              />
            </div>
          </Fragment>
        )}
        <p
          className="BuyRam__advancedOption"
          onClick={this.toggleShowAdvancedOption}
        >
          {isShowAdvancedOption ? 'Back to default option' : '+ advanced option'}
        </p>
        <Button className="BuyRam__buyButton" onClick={this.buyRam}>Buy</Button>
        {isLoading && <LoadingImage />}
      </div>
    )
  }
}

export default BuyRam
