import React, { Component } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import _ from 'lodash'

import Dropdown from 'components/Dropdown'
import iost from 'iostJS/iost.js'

import './NetworkSelector.scss'

type Props = {

}

const _iostNetworks = [
  {
    label: 'IOST MAINNET',
    value: 'https://api.iost.io',
  },
  {
    label: 'LOCALNET',
    value: 'http://127.0.0.1:30001'
  },
  {
    label: 'IOST TESTNET (EVEREST 2.0)',
    // value: 'https://api.iost.io',
    value: 'https://test.api.iost.io',
  },
]

class NetworkSelector extends Component<Props> {
  state = {
    iostNetworks: _iostNetworks,
  }

  componentDidMount() {
    // Network list
    chrome.storage.local.get(['networkList'], (result) => {
      const networkList = result && result.networkList
      if (!networkList) return

      this.setState({
        iostNetworks: [...this.state.iostNetworks, ...networkList]
      })
    })

    // Active network
    chrome.storage.local.get(['activeNetwork'], (result) => {
      const activeNetwork = result && result.activeNetwork

      if (!activeNetwork) {
        // Set default network to iost instance.
        this.changeNetwork(this.state.iostNetworks[0].value)
        return
      }

      const isKnownNetworkIdx = _.findIndex(this.state.iostNetworks, {
        value: activeNetwork
      })

      this.$Dropdown.select(isKnownNetworkIdx !== -1 ? isKnownNetworkIdx : 0)()
    })
  }

  changeNetwork = (url) => {
    const { userInfo, changeLocation } = this.props

    iost.changeNetwork(url)

    if (!userInfo) return

    iost.rpc.blockchain.getAccountInfo(userInfo.accountName)
      .then((accountInfo) => {
        if (!iost.isValidAccount(accountInfo, userInfo.publicKey)) {
          iost.logoutAccount()
          changeLocation('/login')
          return
        }
      })
      .catch(() => {
        iost.logoutAccount()
        changeLocation('/login')
      })
  }

  render() {
    const { iostNetworks } = this.state
    const { className } = this.props
    return (
      <div className={cx('NetworkSelector', className)}>
        <Dropdown
          items={iostNetworks}
          onClick={this.changeNetwork}
          ref={($Dropdown => this.$Dropdown = $Dropdown)}
        />
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  userInfo: state.user.userInfo,
})

export default connect(mapStateToProps)(NetworkSelector)
