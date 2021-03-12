import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { I18n } from 'react-redux-i18n'
import cx from 'classnames'
import iost from 'iostJS/iost'
import { Header, TokenBalance } from 'components'
import Button from 'components/Button'
import ui from 'utils/ui'
import user from 'utils/user'
import * as accountActions from 'actions/accounts';
import { privateKeyToPublicKey, publickKeyToAccount } from 'utils/key'
import utils from 'utils';
import './index.scss'
import bs58 from 'bs58'
const dealList = [
  {id: 1, time: '02/01/2019 11:23:33', transferTo: 'sdingidngmie', status: 0, account: -233 },
  {id: 2, time: '02/01/2019 11:23:33', transferTo: 'sdingidngmie', status: 1, account: -233 },
  {id: 3, time: '02/01/2019 11:23:33', transferTo: 'sdingidngmie', status: 2, account: -233 },
  {id: 4, time: '02/01/2019 11:23:33', transferTo: 'sdingidngmie', status: 0, account: -233 },
  {id: 5, time: '02/01/2019 11:23:33', transferTo: 'sdingidngmie', status: 1, account: -233 },
  {id: 6, time: '02/01/2019 11:23:33', transferTo: 'sdingidngmie', status: 2, account: -233 }
]

type Props = {

}

const Algorithm = {
  Ed25519: 2,
  Secp256k1: 1,
};

class Account extends Component<Props> {
  state = {
    loading: true,
    isShowAccountList: false,
    currentAccount: {},
  }

  componentDidMount() {
    this.init()
  }

  init = async () => {
    ui.settingLocation('/account')
    const { changeLocation } = this.props
    try {
      const accounts = await user.getUsers()
      if(accounts.length){
        user.setUsers(accounts)
        const activeAccount = await user.getActiveAccount()
        const account = activeAccount || accounts[0]
        const { type, name, privateKey } = account
        const password = await user.getLockPassword()
        if(password){
          iost.changeNetwork(utils.getNetWork(account))
          // const encodedPrivateKey = utils.aesDecrypt(privateKey, password)
          // iost.loginAccount(name, encodedPrivateKey)

          iost.changeAccount(account)
          await user.setActiveAccount(account)
          this.setState({
            loading: false,
            currentAccount: account,
          })
        }
      }else {
        changeLocation('/accountImport')
      }
    } catch (err) {
      console.log(err)
    }
  }

  logout = () => {
    const { changeLocation } = this.props
    iost.logoutAccount()
    changeLocation('/login')
  }

  moveTo = (location) => () => {
    const { changeLocation, locationList } = this.props
    ui.settingLocation(location)
    changeLocation(location)
  }

  toggleAccountList = () => {
    this.setState({
      isShowAccountList: !this.state.isShowAccountList,
    })
  }

  chooseAccount = (account) => async () => {
    // const { type, name, privateKey, publicKey, network } = account
    try {
      const ipassword = await user.getLockPassword()
      if(ipassword){
        iost.changeNetwork(utils.getNetWork(account))
        // const encodedPrivateKey = utils.aesDecrypt(privateKey, ipassword)
        // iost.changeNetwork(utils.getNetWork(account.network))
        // iost.loginAccount(name, encodedPrivateKey)

        iost.changeAccount(account)
        await user.setActiveAccount(account)
        this.setState({
          currentAccount: account,
        })
        // console.log('switch account')
        this.toggleAccountList()
      }else {
        // lock
      }
    } catch (err) {

    }
  }

  render() {
    const { isShowAccountList, currentAccount, loading } = this.state
    const { accounts } = this.props

    if(loading) return <div></div>
    return (
      <Fragment>
        <Header onSetting={this.moveTo('/accountSetting')} logo={true} hasAdd onBack={this.moveTo('/assetManage')}>
          <div className="account-currentName-box" onClick={this.toggleAccountList}>
            <i className={cx('circle', currentAccount.network == 'MAINNET' ? '' : currentAccount.network == 'LOCALNET' ? 'local' : 'test')} />
            <span className="account-name">{currentAccount.name}</span>
            <i className={cx('arrow', accounts.length <=1 ? 'arrow-hide' : (isShowAccountList ? 'arrow-down' : 'arrow-right'))}
                />
          </div>
        </Header>
        <div className="account-box">
          <div className={cx('nameList-box', isShowAccountList ? 'show' : '')}>
            <ul className="accountName-list">
              {
                accounts.map((item) =>
                  <li key={user.getUserUnique(item)} onClick={this.chooseAccount(item)}>
                    {/*<i className={cx('circle', item.network != 'MAINNET' ? 'test' : '')} />*/}
                    <span className={cx('account-title', item.network == 'MAINNET' ? '' : item.network == 'LOCALNET' ? 'local' : 'test')}>{item.network == 'MAINNET' ? I18n.t('ManageAccount_Official') : item.network == 'LOCALNET' ? I18n.t('ManageAccount_Local'): I18n.t('ManageAccount_Test')}</span>
                    <span className="account-name">{item.name}</span>
                    <i className={cx('check', user.getUserUnique(item) == user.getUserUnique(currentAccount) ? 'checked' : '')} />
                  </li>)
              }
            </ul>
          </div>

          <TokenBalance account={currentAccount} moveTo={this.moveTo}/>

          <div className={cx("btn-box", 'active')}>
            <Button
              className="btn-transfer btn-account"
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

          <div className="dealRecord-box">
            <div className="title-box">
              <div className="line"></div>
              <span className="title">{I18n.t('dealRecord')}</span>
              <div className="line"></div>
            </div>
            <div className="list-box">
              {
                dealList.map((item) =>
                  <div className="item-box" key={item.id}>
                    <div className="left">
                      <span className="time">{item.time}</span>
                      <span className="transferTo">{I18n.t('transferTo', { name: item.transferTo })}</span>
                    </div>
                    <div className="right">
                      <span className={cx('status', item.status == 0 ? 'confirmed' : (item.status == 1 ? 'notApproved' : 'failure'))}>
                        {item.status == 0 ? I18n.t('confirmed') : (item.status == 1 ? I18n.t('notApproved') : I18n.t('failure'))}
                      </span>
                      <span className="account">{item.account} IOST</span>
                    </div>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  accounts: state.accounts.accounts,
  locationList: state.ui.locationList,
})

export default connect(mapStateToProps)(Account)
