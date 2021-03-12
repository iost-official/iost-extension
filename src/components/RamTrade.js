import React, { Component } from 'react'

import UserRamStatus from 'components/UserRamStatus'
import Input from 'components/Input'
import Button from 'components/Button'
import Tab from 'components/Tab'
import BuyRam from 'components/BuyRam'
import SellRam from 'components/SellRam'
import LendRam from 'components/LendRam'
import LoadingImage from 'components/LoadingImage'
import iost from 'iostJS/iost'
import user from 'utils/user'

import './RamTrade.scss'

type Props = {

}

class RamTrade extends Component<Props> {
  state = {
    isLoading: false,
    pledgeAmount: '',
    pledgeForWho: '',
    isShowPledgerList: false,
    ramMarketInfo: {},
  }

  intervalID = null

  componentDidMount() {
    this.intervalID = setInterval(this.getRAMInfo, 1000)
  }

  componentWillUnmount() {
    if (this.intervalID !== undefined) {
      clearInterval(this.intervalID)
    }
  }

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    })
  }

  getRAMInfo = async () => {
    const ramMarketInfo = await iost.rpc.getProvider().send('get', 'getRAMInfo')
    this.setState({
      ramMarketInfo,
    })
  }

  togglePledgerList = () => {
    this.setState({
      isShowPledgerList: !this.state.isShowPledgerList,
    })
  }

  sellRam = async () => {
    const { amount, forWho } = this.state
    const ID = iost.account.getID()
    const activeAccount = await user.getActiveAccount()

    iost.sendTransaction('ram.iost', 'sell', [ID, forWho || ID, Number(amount)], activeAccount.network === 'LOCALNET' ? activeAccount.chainID : null)
      .onPending(console.log)
      .onSuccess(console.log)
      .onFailed(console.log)
  }

  lendRam = () => {
    const { amount, forWho } = this.state
    const ID = iost.account.getID()

    iost.sendTransaction('ram.iost', 'lend', [ID, forWho || ID, Number(amount)])
      .onPending(console.log)
      .onSuccess(console.log)
      .onFailed(console.log)
  }

  render() {
    const { ramMarketInfo, isLoading, isShowPledgerList } = this.state
    const { ramInfo } = this.props

    return (
      <div className="RamTrade">
        <UserRamStatus ramInfo={ramInfo} />
        <Input
          name="amount"
          onChange={this.handleChange}
        />
        <Tab
          tabDict={{
            buy: <BuyRam ramMarketInfo={ramMarketInfo} />,
            sell: <SellRam ramMarketInfo={ramMarketInfo} />,
            lend: <LendRam />,
          }}
        />
        {isLoading && <LoadingImage />}
      </div>
    )
  }
}

export default RamTrade
