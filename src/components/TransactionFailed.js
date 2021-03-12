import React, { Component } from 'react'
import { I18n } from 'react-redux-i18n'
import cx from 'classnames'

import './TransactionFailed.scss'

type Props = {

}

class TransactionFailed extends Component<Props> {
  render() {
    const { tx, className } = this.props

    return (
      <div className={cx('TransactionFailed', className)}>
        <header className="TransactionFailed__title">{I18n.t('transactionFailure')}</header>
        <p className="TransactionFailed__item">
          <p>{I18n.t('txid')}:</p>
          <p className="TransactionFailed__item--txhash">{tx.tx_hash}</p>
        </p>
        <p className="TransactionFailed__item">
          {I18n.t('gasUsage')}: {JSON.stringify(tx)}
        </p>
        {tx.message && (
          <p className="TransactionFailed__item TransactionFailed__item--message">
            {I18n.t('message')}: {tx.message} (status code: {tx.status_code})
          </p>
        )}
        {Object.keys(tx.ram_usage).length !== 0 && (
          <p className="TransactionFailed__item">
            {I18n.t('ramUsage')}: {Object.values(tx.ram_usage).map(a => <p>{a}</p>)}
          </p>
        )}
      </div>
    )
  }
}

export default TransactionFailed
