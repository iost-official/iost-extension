import React, { Component, Fragment } from 'react'
import { I18n } from 'react-redux-i18n'
import { Header } from 'components'
import classnames from 'classnames'
import utils from 'utils';
import iost from 'iostJS/iost'
import user from 'utils/user'
import ui from 'utils/ui';
import './index.scss'

export default class extends Component {
  state = {
    loading: true,
    whitelist: [],
    activeAccount: {},
    accounts: []
  }

  moveTo = (location) => () => {
    this.props.changeLocation(location)
  }

  deleteByDomain = domain => () => {
    const whitelist = this.state.whitelist.filter(item => item.domain !== domain)

    chrome.storage.local.set({ whitelist }, () => {
      this.setState({ whitelist })
    })
  }

  getWhiteList = () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['whitelist'], ({whitelist}) => {
        resolve(whitelist)
      })
    })
  }

  syncWithStorage = () => {
    // const activeAccount = await user.getActiveAccount()
    // const accounts = await user.getUsers()
    // const whitelist = await this.getWhiteList()

    Promise.all([
      user.getActiveAccount(),
      user.getUsers(),
      this.getWhiteList()
    ]).then(([activeAccount, accounts, whitelist]) => {
      this.setState({
        loading: false,
        activeAccount,
        accounts,
        whitelist: whitelist || []
      })
    })
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

        iost.changeAccount(account)
        this.setState({
          activeAccount: account
        })
        await user.setActiveAccount(account)
        // console.log('switch account')
        this.toggleAccountList()
      }else {
        // lock
      }
    } catch (err) {

    }

  }

  componentDidMount() {
    this.syncWithStorage()
  }

  render() {
    const { isShowAccountList, whitelist, accounts, activeAccount } = this.state
    const activeAccountSymbol = user.getUserUnique(activeAccount)
    const domains = _.uniq(whitelist.filter(item => `${item.network}_${item.account}` === activeAccountSymbol).map(item => item.domain))

    return (
      <Fragment>
        <Header
          title={I18n.t('Settings_whitelist')}
          onBack={this.moveTo('/accountSetting')}
          hasSetting={false}>
          <div className="x-account-currentName-box" onClick={this.toggleAccountList}>
            <i className={classnames('circle', activeAccount.network == 'MAINNET' ? '': activeAccount.network == 'LOCALNET' ? 'local' : 'test')} />
            <span className="account-name">{activeAccount.name}</span>
            <i className={classnames('arrow', accounts.length <=1 ? 'arrow-hide' : (isShowAccountList ? 'arrow-down' : 'arrow-right'))}
                />
          </div>
          <div className={classnames('x-nameList-box', isShowAccountList ? 'show' : '')}>
            <ul className="accountName-list">
              {
                accounts.map((item) =>
                  <li key={user.getUserUnique(item)} onClick={this.chooseAccount(item)}>
                    <span className={classnames('account-title', item.network == 'MAINNET' ? '': item.network == 'LOCALNET' ? 'local' : 'test')}>
                      {item.network == 'MAINNET' ? I18n.t('ManageAccount_Official') : item.network == 'LOCALNET' ? I18n.t('ManageAccount_Local') : I18n.t('ManageAccount_Test')}
                    </span>
                    <span className="account-name">{item.name}</span>
                    <i className={classnames('check', user.getUserUnique(item) == user.getUserUnique(activeAccount) ? 'checked' : '')} />
                  </li>)
              }
            </ul>
          </div>
        </Header>
        <div className="whitelist-box">
          <ul>
            {
              !this.state.loading && domains.length === 0 && (
                <center style={{color: '#a7a7a7'}}>Empty</center>
              )
            }
            {
              domains.map(domain => (
                <li key={domain}>
                  <i className="item-icon"></i>
                  <span className="domain-name">{domain}</span>
                  <span className="del-btn" onClick={this.deleteByDomain(domain)}>
                    <i className="del-icon"></i>
                  </span>
                </li>
              ))
            }
          </ul>
        </div>
      </Fragment>
    )
  }
}
