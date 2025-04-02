import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import config from '../config.json';


import {
    loadProvider,
    loadNetwork,
    loadAccount,
    loadTokens,
    loadExchange
} from '../store/interactions';

import Navbar from './Navbar';
import Markets from './Markets';
import Balance from './Balance';


function App() {

    const dispatch = useDispatch()

    const loadBlocakChainData = async () => {

        //Connectss ethers to the blockchain
        const provider = loadProvider(dispatch)

        // Fetch current network's chainId (e.g. hardhat: 31337, kovan: 42)
        const chainId = await loadNetwork(provider, dispatch)

        // Fetch current account & balance from Metamask
        window.ethereum.on('chainChanged', () => {
            window.location.reload()
        })

        // Fetch current account & balance from Metamask when changed
        window.ethereum.on('accountsChanged', () => {
            loadAccount(provider, dispatch)
        })

        // Load token smart contracts
        const tokETH = config[chainId].tokETH;
        const tokHAR = config[chainId].tokHAR;
        await loadTokens(provider, [tokETH.address, tokHAR.address], dispatch)

        // Load exchange smart contract
        const exchangeConfig = config[chainId].exchange;
        const exchange = await loadExchange(provider, exchangeConfig.address, dispatch)
        console.log(exchange.address)
    }


    useEffect(() => {
        loadBlocakChainData();
    })

    return (
        <div>

            <Navbar />
            <main className='exchange grid'>
                <section className='exchange__section--left grid'>

                    <Markets />

                    <Balance />

                    {/* Order */}

                </section>
                <section className='exchange__section--right grid'>

                    {/* PriceChart */}

                    {/* Transactions */}

                    {/* Trades */}

                    {/* OrderBook */}

                </section>
            </main>

            {/* Alert */}

        </div>
    );
}

export default App;