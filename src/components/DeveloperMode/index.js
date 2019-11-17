import React, { Component, Fragment } from 'react'
import { I18n } from 'react-redux-i18n'
import utils from 'utils';

import { Header } from 'components'
// import i18n from 'utils/i18n'

import './index.scss'

class DeveloperMode extends Component<Props> {
    state = {
        developerMode: undefined
    };

    componentDidMount() {
        this.getDeveloperStatus();
    }

    getDeveloperStatus = async () => {
        const developerMode = await utils.getStorage('developerMode');
        console.log(developerMode)
        this.setState({
            developerMode
        });
    }
    
    moveTo = (location) => () => {
        const { changeLocation } = this.props
        changeLocation(location)
    }

    toggleDeveloperMode = async() => {
        const developerMode = !this.state.developerMode;
        this.setState({developerMode});
        console.log(developerMode);
        utils.setStorage('developerMode', developerMode);
    }

    render() {
        if(this.state.developerMode === undefined){
            return null;
        }
        return (
            <Fragment>
                <Header title={I18n.t('Settings_developerMode')} onBack={this.moveTo('/accountSetting')} hasSetting={false} />
                <div className="developerMode-box">
                    <ul>
                        <li onClick={this.toggleDeveloperMode}>
                            <span className="name">Developer Mode</span>
                            <span className={ this.state.developerMode ? 'enabled' : 'disabled' }><span className="slider round"></span></span>
                        </li>
                    </ul>
                </div>
            </Fragment>
        )
    }
}

export default DeveloperMode