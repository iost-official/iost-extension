import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Login, Account, AccountImport, AccountManage, DeveloperMode, TokenTransfer, TokenTransferFailed, TokenTransferSuccess,
  AccountQRCode, AccountCreateStep1, AccountCreateStep2, AccountCreateStep3, AccountSetting, ChangePwd,
  Lock, AccountAdd, ChangeLanguage, IostWallet, UserAgreement, GasManage, RamManage, WhiteList, TokenDetail,
  AssetManage
} from 'components'
import Settings from 'components/Settings'
import Popup from 'components/Popup'

import iost from 'iostJS/iost'
import utils from 'utils'
import user from 'utils/user'
import * as accountActions from 'actions/accounts'
import './App.scss'
import ui from "utils/ui";

type Props = {
  children: React.DOM,
}
// /var/www/iost-helloworld-dapp/dist
class App extends Component<Props> {
  state = {
    currentLocation: '/login',
  }

  componentDidMount() {
    // chrome.storage.local.remove(['password'],({ password }) => {
    //   console.log(password)
    // })
    this.init()
  }

  init = async () => {
    try {
      const enpassword = await user.getEnPassword()
      if(enpassword){
        const lockState = await user.getLockState()
        if(lockState === false){
          //解锁页面
          this.changeLocation('/lock')
        }else {
          const accounts = await user.getUsers()
          if (accounts.length){
            user.setUsers(accounts)
            const activeAccount = await user.getActiveAccount()
            const account = activeAccount || accounts[0]
            const { type, name, privateKey } = account
            const password = await user.getLockPassword()
            const encodedPrivateKey = utils.aesDecrypt(privateKey, password)
            iost.changeNetwork(utils.getNetWork(account))
            // this.changeLocation('/gasManage')

            iost.changeAccount(account)
            await user.setActiveAccount(account)
            this.changeLocation('/account')

            chrome.storage.local.get(['activeAccount'], ({activeAccount}) => {
              // console.log('当前账号', activeAccount)
            })
          }else {
            this.changeLocation('/accountImport')
          }
        }
      }else {
        this.changeLocation('/login')
      }
    } catch (err) {
      console.log(err)
    }
  }

  changeLocation = (location) => {
    this.setState({
      currentLocation: location,
    })
  }

  renderComponentByLocation = () => {
    const { currentLocation } = this.state
    switch (currentLocation) {
      case '/login':
        return <Login changeLocation={this.changeLocation} />
      case '/account':
        return <Account changeLocation={this.changeLocation} />
      case '/setting':
        return <Settings changeLocation={this.changeLocation} />
      case '/accountImport':
        return <AccountImport changeLocation={this.changeLocation} />
      case '/accountManage':
        return <AccountManage changeLocation={this.changeLocation} />
      case '/tokenTransfer':
        return <TokenTransfer changeLocation={this.changeLocation} />
      case '/tokenTransferFailed':
        return <TokenTransferFailed changeLocation={this.changeLocation} />
      case '/tokenTransferSuccess':
        return <TokenTransferSuccess changeLocation={this.changeLocation} />
      case '/accountQRCode':
        return <AccountQRCode changeLocation={this.changeLocation} />
      case '/accountCreateStep1':
        return <AccountCreateStep1 changeLocation={this.changeLocation} />
      case '/accountCreateStep2':
        return <AccountCreateStep2 changeLocation={this.changeLocation} />
      case '/accountCreateStep3':
        return <AccountCreateStep3 changeLocation={this.changeLocation} />
      case '/accountSetting':
        return <AccountSetting changeLocation={this.changeLocation} />
      case '/changePwd':
        return <ChangePwd changeLocation={this.changeLocation} />
      case '/lock':
        return <Lock changeLocation={this.changeLocation} />
      case '/accountAdd':
        return <AccountAdd changeLocation={this.changeLocation} />
      case '/changeLanguage':
        return <ChangeLanguage changeLocation={this.changeLocation} />
      case '/whitelist':
        return <WhiteList changeLocation={this.changeLocation} />
      case '/developerMode':
        return <DeveloperMode changeLocation={this.changeLocation} />
      case '/iostWallet':
        return <IostWallet changeLocation={this.changeLocation} />
      case '/userAgreement':
        return <UserAgreement changeLocation={this.changeLocation} />
      case '/gasManage':
        return <GasManage changeLocation={this.changeLocation} />
      case '/ramManage':
        return <RamManage changeLocation={this.changeLocation} />
      case '/tokenDetail':
        return <TokenDetail changeLocation={this.changeLocation} />
      case '/assetManage':
        return <AssetManage changeLocation={this.changeLocation} />
    }
  }

  render() {
    return (
      <div className="App">
        {this.renderComponentByLocation()}
        {/*这个是新的全屏弹窗容器，应该用不到了*/}
        <Popup />
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  locale: state.i18n.locale,
})

export default connect(mapStateToProps)(App)
