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

export const getTokenInfo = async (token, isProd) => {
  const url = isProd == 'MAINNET' ? 'https://api.iost.io/' : isProd == 'LOCALNET' ? 'http://127.0.0.1:30001' : 'https://test.api.iost.io/';
  try {
    const { data } = await axios.get(`${url}getTokenInfo/${token}/0`,{
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
  {symbol: 'iost', fullName: 'iost'},
  {symbol: 'emogi', fullName: 'EMOGI'},
  {symbol: 'abct', fullName: 'iostabc token'}
]
