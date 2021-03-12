import React, { Component, Fragment } from 'react'
import { I18n } from 'react-redux-i18n'
import { connect } from 'react-redux'
import { Header, Toast } from 'components'
import Button from 'components/Button'
import LoadingImage from 'components/LoadingImage'
import NetworkSelector from 'components/NetworkSelector'
import iost from 'iostJS/iost'
import { privateKeyToPublicKey, publickKeyToAccount, nameAndPublicKeyToAccount } from 'utils/key'
import { localnetDefault } from 'constants/localnet'
import utils from 'utils'
import ui from 'utils/ui';
import user from 'utils/user';
import _trim from 'lodash/trim'
import * as accountActions from 'actions/accounts'

import './index.scss'

type Props = {

}

const getPassword = () => new Promise((resolve, reject) => {
  chrome.runtime.sendMessage({
    action: 'GET_PASSWORD',
  },(res)=> {
    if(res != ''){
      resolve(res)
    }else {
      reject('no password')
    }
  })
})

class AccountImport extends Component<Props> {

  state = {
    privateKey: '',
    accountName: '',
    endpoint: '',
    chainID: '',
    isLoading: false,
    errorMessage: '',
    developerMode: undefined,
    canBack: true
  }

  componentDidMount() {
    const { locationList } = this.props
    this.getDeveloperStatus();
    if(locationList[locationList.length-1].indexOf('accountImport') < 0){
      ui.settingLocation('/accountImport')
    }
    chrome.runtime.sendMessage({
      action: 'GET_PASSWORD',
    },async (res)=> {
      if(res){
        try {
          const accounts = await user.getUsers()
          this.setState({
            canBack: accounts.length
          })
        } catch (err) {
          console.log(err)
        }
      }
    })
  }

  getDeveloperStatus = async () => {
    const developerMode = await utils.getStorage('developerMode');

    this.setState(developerMode ? { developerMode, ...localnetDefault } : { developerMode });
  }

  onSubmit = async () => {
    this.setState({
      isLoading: true
    })
    const privateKey = _trim(this.state.privateKey);
    const accountName = _trim(this.state.accountName);
    const { changeLocation } = this.props;

    let publicKey, accounts = []
    try {
      publicKey = privateKeyToPublicKey(privateKey)
      if(accountName) {
        let account = await nameAndPublicKeyToAccount(accountName, publicKey, this.state.endpoint)
        const password = await user.getLockPassword()
        accounts = [{ 
            name: account.name,
            endpoint: this.state.endpoint,
            chainID: this.state.chainID,
            network: 'LOCALNET',
            privateKey: utils.aesEncrypt(privateKey, password),
            publicKey: publicKey,
        }]
      } else {
        let accounts1 = await publickKeyToAccount(publicKey, true)
        let accounts2 = await publickKeyToAccount(publicKey, false)
        const password = await user.getLockPassword()
        accounts1 = accounts1.map(item => {
          return {
            name: item.account_info.name,
            network: 'MAINNET',
            privateKey: utils.aesEncrypt(privateKey, password),
            publicKey: publicKey,
          }
        });
        accounts2 = accounts2.map(item => {
          return {
            name: item.account_info.name,
            network: 'TESTNET',
            privateKey: utils.aesEncrypt(privateKey, password),
            publicKey: publicKey,
          }
        });
        accounts = accounts1.concat(accounts2);
      }
    } catch (e) {
      console.log(e)
      publicKey = ''
    }

    const invalidLoginInput = !accounts.length || !privateKey || !publicKey

    if (invalidLoginInput) {
      if (!privateKey) {
        Toast.html(I18n.t('ImportAccount_Tip2'))
      } else if (!publicKey) {
        Toast.html(I18n.t('ImportAccount_Tip3'))
      } else if (!accounts.length) {
        Toast.html(I18n.t('ImportAccount_Tip1'))
      }
      this.setState({
        isLoading: false,
      })
      this.throwErrorMessage()
      return
    }

    try {

      accounts = await user.addUsers(accounts)
      const activeAccount = await user.getActiveAccount()
      if(activeAccount){
        changeLocation('/accountManage')
      }else {
        iost.changeNetwork(utils.getNetWork(account[0]))
        iost.rpc.blockchain.getAccountInfo(accounts[0].name)
        .then((accountInfo) => {
          if (!iost.isValidAccount(accountInfo, accounts[0].publicKey)) {
            this.throwErrorMessage()
            return
          }
          iost.changeAccount(accounts[0])

          // iost.loginAccount(accounts[0].name, accounts[0].publicKey)
          chrome.storage.local.set({ activeAccount: accounts[0] },() => {
            changeLocation('/accountManage')
          })
        })
        .catch(this.throwErrorMessage)
      }

    } catch (e) {
      console.log(e)
    }
  }

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
      errorMessage: '',
    })
  }

  throwErrorMessage = () => {
    this.setState({
      errorMessage: I18n.t('invalidLoginInfo'),
    })
  }

  // 首次登陆页，或添加账号页
  backTo = () => {
    const { changeLocation, locationList } = this.props
    const { canBack } = this.state
    if(canBack){
      ui.deleteLocation()
      changeLocation(locationList[locationList.length - 1])
    }
  }

  render() {
    const { isLoading, canBack } = this.state
    const { changeLocation, locationList } = this.props
    if(this.state.developerMode === undefined) { 
      return null;
    }
    return (
      <Fragment>
        <Header title={I18n.t('firstLogin_ImportAccount')} logo={!canBack} onBack={this.backTo} hasSetting={false} />
        <div className="accountImport-box">
          <textarea name="privateKey" id="" className="privateKey-content" onChange={this.handleChange} placeholder={I18n.t('ImportAccount_EnterPrivate')}/>
          {this.state.developerMode && (
            <Fragment>
              <p className="accountNameText">{I18n.t('ImportAccount_LocalNetMessage')}</p>
              <input name="accountName" id="" className="input-accountName" onChange={this.handleChange} placeholder={I18n.t('ImportAccount_EnterName')}/>
              {this.state.accountName && 
                <Fragment>
                  <p className="localnetInfoText">{I18n.t('ImportAccount_LocalNetEndpointMessage')}</p>
                  <input name="endpoint" id="" value={this.state.endpoint} className="input-localnetInfo" onChange={this.handleChange} placeholder={I18n.t('ImportAccount_EnterEndpoint')}/>
                  <p className="localnetInfoText">{I18n.t('ImportAccount_LocalNetChainIDMessage')}</p>
                  <input name="chainID" id="" min="0" type="number" value={this.state.chainID} className="input-localnetInfo" onChange={this.handleChange} placeholder={I18n.t('ImportAccount_EnterChainID')}/>
                </Fragment>
              }
            </Fragment>
          )}
          <Button className="btn-submit" onClick={this.onSubmit}>{isLoading ? <LoadingImage /> : I18n.t('ImportAccount_Submit')}</Button>
        </div>
      </Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  accounts: state.accounts.accounts,
  locationList: state.ui.locationList,
})

export default connect(mapStateToProps)(AccountImport)
