import {
  updateSavedTokenSymbols,
  selectToken,
  selectedListSymbol,
} from 'actions/token'
import store from '../store'
import axios from 'axios'

export const token = {
  updateSavedTokenSymbols: (tokenSymbols) => store.dispatch(updateSavedTokenSymbols(tokenSymbols)),
  selectToken: (tokenSymbol) => store.dispatch(selectToken(tokenSymbol)),
  getTokenSymbols: () => store.getState().token.savedTokenSymbols,
}

export const getTokenInfo = async (token, account) => {
  const { network, endpoint } = account
  const url = network == 'MAINNET' ? 'https://api.iost.io/' : network == 'LOCALNET' ? endpoint || 'http://127.0.0.1:30001/' : 'https://test.api.iost.io/';
  try {
    const { data } = await axios.get(`${url.endsWith("/") ? url : `${url}/` }getTokenInfo/${token}/0`,{
      timeout: 10000
    })
    if(data.code && data.code != 0){
      throw data.message
    }
    return data
  } catch (err) {
    console.log(err)
  }
}

export default token

export const defaultAssets = [
  {symbol: 'iost', fullName: 'iost', onlyIssuerCanTransfer:false },
  {symbol: 'husd', fullName: 'IOST-Peg HUSD Token', onlyIssuerCanTransfer:true, issuer:'Contract3zCNX76rb3LkiAamGxCgBRCNn6C5fXJLaPPhZu2kagY3'},
  {symbol: 'lol', fullName: 'LOL', onlyIssuerCanTransfer:false},
  {symbol: 'abct', fullName: 'iostabc token', onlyIssuerCanTransfer:false}
]
