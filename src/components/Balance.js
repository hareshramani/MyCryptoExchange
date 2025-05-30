import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dapp from '../assets/dapp.svg'
import { loadBalances, transferTokens } from '../store/interactions';
import { exchange, tokens } from '../store/reducers';
const Balance = () => {

    const [token1TransferAmount, settoken1TransferAmount] = useState(0)

    const dispatch = useDispatch()
    const provider = useSelector(state => state.provider.connection)
    const account = useSelector(state => state.provider.account)

    const exchange = useSelector(state => state.exchange.contract)
    const exchangeBalances = useSelector(state => state.exchange.balances)
    const transferInProgress = useSelector(state => state.exchange.transferInProgress)

    const tokens = useSelector(state => state.tokens.contracts)

    const symbols = useSelector(state => state.tokens.symbols)

    const tokenBalances = useSelector(state => state.tokens.balances)

    const amountHandler = (e, token) => {
        if (token.address === tokens[0].address) {
            settoken1TransferAmount(e.target.value)
        }
        console.log(token1TransferAmount)
    }


    //Step 1: transfer intiated
    //Step 2: send notification to app for pending transfer
    //Step 3: BC confirmed the transfer
    //Step 4: update app balance
    //Step 5: handle failed

    const depositHandler = (e, token) => {
        e.preventDefault()
        if (token.address === tokens[0].address) {
            transferTokens(provider, exchange, 'deposit', token, token1TransferAmount, dispatch)
            settoken1TransferAmount(0)
        }
    }



    useEffect(() => {
        if (exchange && tokens[0] && tokens[1] && account) {
            loadBalances(exchange, tokens, account, dispatch)
        }
    }, [exchange, tokens, account, transferInProgress])

    return (
        <div className='component exchange__transfers'>
            <div className='component__header flex-between'>
                <h2>Balance</h2>
                <div className='tabs'>
                    <button className='tab tab--active'>Deposit</button>
                    <button className='tab'>Withdraw</button>
                </div>
            </div>

            {/* Deposit/Withdraw Component 1 (DApp) */}

            <div className='exchange__transfers--form'>
                <div className='flex-between'>
                    <p>
                        <small>Token</small><br />
                        <img src={dapp} alt='Tken Logo' />{symbols && symbols[0]}
                    </p>
                    <p>
                        <small>Wallet</small><br />
                        {tokenBalances && tokenBalances[0]}
                    </p>
                    <p>
                        <small>Excahnge</small><br />
                        {exchangeBalances && exchangeBalances[0]}
                    </p>

                </div>

                <form onSubmit={(e) => depositHandler(e, tokens[0])}>
                    <label htmlFor="token0">{symbols && symbols[0]} Amount</label>
                    <input type="text" id='token0' placeholder='0.0000' onChange={(e) => amountHandler(e, tokens[0])}
                        value={token1TransferAmount === 0 ? '' : token1TransferAmount}
                    />

                    <button className='button' type='submit'>
                        <span>Deposit</span>
                    </button>
                </form>
            </div>

            <hr />

            {/* Deposit/Withdraw Component 2 (mETH) */}

            <div className='exchange__transfers--form'>
                <div className='flex-between'>

                </div>

                <form>
                    <label htmlFor="token1"></label>
                    <input type="text" id='token1' placeholder='0.0000' />

                    <button className='button' type='submit'>
                        <span></span>
                    </button>
                </form>
            </div>

            <hr />
        </div>
    );
}

export default Balance;