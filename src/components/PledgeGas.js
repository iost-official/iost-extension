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

import './PledgeGas.scss'

type Props = {

}

class PledgeGas extends Component<Props> {
  state = {
    isLoading: false,
    amount: '',
    forWho: '',
    isShowAdvancedOption: false,
  }

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    })
  }

  toggleShowAdvancedOption = () => {
    this.setState({
      isShowAdvancedOption: !this.state.isShowAdvancedOption,
    })
  }

  pledgeToken = async () => {
    const { amount, forWho } = this.state
    const ID = iost.account.getID()
    const activeAccount = await user.getActiveAccount()

    iost.sendTransaction('gas.iost', 'pledge', [ID, forWho || ID, amount], activeAccount.network === 'LOCALNET' ? activeAccount.chainID : null )
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
    const { isShowAdvancedOption, amount, isLoading } = this.state
    return (
      <div className="PledgeGas">
        <p className="PledgeGas__description">1. {I18n.t('howManyIOSTWillYouPledge')}</p>
        <div className="PledgeGas__InputWrapper">
          <Input
            className="PledgeGas__Input"
            name="amount"
            onChange={this.handleChange}
          />
          <span className="PledgeGas__InputDescription">IOST</span>
        </div>
        {!!amount && (
          <p className="PledgeGas__expectedEarnGas">
            = Get {(Number(amount) * 100000)} immediate iGAS + Generate {(Number(amount) * 200000)} iGAS during 2 days.
          </p>
        )}
        {isShowAdvancedOption && (
          <Fragment>
            <p className="PledgeGas__description">
              2. {I18n.t('whichAccountWillGetGasThroughPledge')}
            </p>
            <div className="PledgeGas__InputWrapper">
              <Input
                className="PledgeGas__Input"
                name="forWho"
                onChange={this.handleChange}
              />
            </div>
          </Fragment>
        )}
        <p
          className="PledgeGas__advancedOption"
          onClick={this.toggleShowAdvancedOption}
        >
          {isShowAdvancedOption ? 'Back to default option' : '+ advanced option'}
        </p>
        <Button
          className="PledgeGas__pledgeButton"
          onClick={this.pledgeToken}
        >
          Pledge
        </Button>
        {isLoading && <LoadingImage />}
      </div>
    )
  }
}

export default PledgeGas
