import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { I18n } from 'react-redux-i18n'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Header, Modal, Toast } from 'components'
import classnames from 'classnames'
import iost from 'iostJS/iost'
import bs58 from 'bs58';
import * as accountActions from 'actions/accounts'
import utils from 'utils';
import ui from 'utils/ui';
import user from 'utils/user';
import './index.scss'


const { Modal1 } = Modal

class AccountManage extends Component<Props> {

  state = {
    password: undefined
  }

  componentDidMount() {
    ui.settingLocation('/accountManage')
    this.getPassword();
  }

  getPassword = async () => {
    const password = await user.getLockPassword();
    console.log(password);
    this.setState({
      password
    });
  }

  onCopy = () => {
    Toast.html(I18n.t('ManageAccount_Copy'))
  }

  moveTo = (location) => () => {
    const { changeLocation } = this.props
    changeLocation(location)
  }

  // 第一次导入账号后，点击返回会直接到主页account页面，
  // 正常情况下，从设置页进入，也就返回设置页。
  backTo = () => {
    const { changeLocation, locationList } = this.props
    ui.deleteLocation()
    const currentLocation = locationList[locationList.length - 1]
    if (currentLocation == '/accountImport') {
      changeLocation('/account')
    } else {
      changeLocation('/accountSetting')
    }
  }

  onDelete = async () => {
    const accounts = this.props.accounts.filter(item => user.getUserUnique(item) != user.getUserUnique(this.delItem))
    await user.setUsers(accounts)
    const activeAccount = await user.getActiveAccount()
    if(activeAccount && user.getUserUnique(activeAccount) == user.getUserUnique(this.delItem)){
      if(accounts.length){
        const account = accounts[0]
        // reset current account

        iost.changeNetwork(utils.getNetWork(account))
        // iost.loginAccount(account.name, account.publicKey)
        iost.changeAccount(account)
        user.setActiveAccount(account)

      }else {
        await user.removeActiveAccount()
        this.props.changeLocation('/accountImport')
      }
    }
    ui.toggleModal()
  }

  deleteAccount = (item) => () => {
    this.delItem = item
    ui.toggleModal()
  }

  render() {
    const { accounts } = this.props;
    if (!this.state.password) { return null; }
    return (
      <Fragment>
        <Header
          title={I18n.t('Settings_accountManage')}
          onBack={this.backTo}
          onAddIost={this.moveTo('/accountImport')}
          setting={false}
        />
        <div className="accountManage-box">
          {
            accounts.map((item) =>
              <div className="account-item" key={user.getUserUnique(item)}>
                <div className="left">
                  <div className="account-name-box">
                    <span className={classnames('account-title', item.network == 'MAINNET' ? '' : item.network == 'LOCALNET' ? 'local' : 'test')}>{item.network == 'MAINNET' ? I18n.t('ManageAccount_Official') : item.network == 'LOCALNET' ? I18n.t('ManageAccount_Local') : I18n.t('ManageAccount_Test')}</span>
                    <span className="account-name">{item.name}</span>
                  </div>
                  <div className="publicKey-box">
                  <span className="publicKey-title">{I18n.t('ManageAccount_PublicKey')}</span>
                    <span className="publicKey-name">
                      <span className="truncate">************</span>
                      <CopyToClipboard onCopy={this.onCopy} text={item.publicKey}>
                        <i className="copy" />
                      </CopyToClipboard>
                    </span>
                  </div>
                </div>
                <i className="right" onClick={this.deleteAccount(item)} />
              </div>
            )
          }
        </div>
        <Modal1 onDelete={this.onDelete} />
      </Fragment>
    )
  }
}

const mapStateToProps = (state) => ({
  accounts: state.accounts.accounts,
  locationList: state.ui.locationList
})

export default connect(mapStateToProps)(AccountManage)
