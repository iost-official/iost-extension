import React, { Component, Fragment } from 'react'
import { I18n } from 'react-redux-i18n'

import Input from 'components/Input'
import Button from 'components/Button'
import LoadingImage from 'components/LoadingImage'
import TransactionSuccess from 'components/TransactionSuccess'
import TransactionFailed from 'components/TransactionFailed'
import ui from 'utils/ui'
import user from 'utils/user'
import iost from 'iostJS/iost'

import './LendRam.scss'

type Props = {

}

class LendRam extends Component<Props> {
  state = {
    amount: 0,
    forWho: '',
    isLoading: false,
  }

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    })
  }

  lendRam = async () => {
    const { amount, forWho } = this.state
    const ID = iost.account.getID()
    const activeAccount = await user.getActiveAccount()

    iost.sendTransaction('ram.iost', 'lend', [ID, forWho, Number(amount)], activeAccount.network === 'LOCALNET' ? activeAccount.chainID : null)
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
    const { amount, isLoading } = this.state

    return (
      <div className="LendRam">
        <p className="LendRam__description">1. {I18n.t('howManyBytesWillYouLend')}</p>
        <div className="LendRam__InputWrapper">
          <Input
            className="LendRam__Input"
            name="amount"
            onChange={this.handleChange}
          />
          <span className="LendRam__InputDescription">{I18n.t('bytes')}</span>
        </div>
        <p className="LendRam__description">
          2. {I18n.t('whichAccountWillGetLendRam')}
        </p>
        <div className="LendRam__InputWrapper">
          <Input
            className="LendRam__Input"
            name="forWho"
            onChange={this.handleChange}
          />
        </div>
        <Button className="LendRam__lendButton" onClick={this.lendRam}>Lend</Button>
        {isLoading && <LoadingImage />}
      </div>
    )
  }
}

export default LendRam
