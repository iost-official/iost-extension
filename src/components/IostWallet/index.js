import React, { Component, Fragment } from 'react'
import { I18n } from 'react-redux-i18n'

import { Header } from 'components'
import ui from 'utils/ui';
import './index.scss'

const settingList = [
  // { id: 1, name: 'nodeVoting' },
  { id: 2, name: 'userAgreement' },
  { id: 3, name: 'developerMode' },
]
type Props = {

}

class IostWallet extends Component<Props> {
  moveTo = (location) => () => {
    const { changeLocation } = this.props
    changeLocation(location)
  }

  moveItem = (location) => () => {
    if (location == 'userAgreement') {
      ui.settingLocation(`/${location}`)
      this.moveTo(`/${location}`)()
    } else if (location == 'developerMode') {
      ui.settingLocation(`/${location}`)
      this.moveTo(`/${location}`)()
    } else if (location == 'nodeVoting') {
      console.log('超链接到用户投票页')
    }
  }

  render() {
    return (
      <Fragment>
        <Header title={I18n.t('Settings_iostWallet')} onBack={this.moveTo('/accountSetting')} hasSetting={false} />
        <div className="iostWallet-box">
          <ul>
            {
              settingList.map((item) =>
                <li onClick={this.moveItem(item.name)} key={item.id}>
                  <i className={item.name} />
                  <span className="name">{I18n.t(`AboutIOST_${item.name}`)}</span>
                </li>
              )
            }
          </ul>
        </div>
      </Fragment>
    )
  }
}

export default IostWallet
