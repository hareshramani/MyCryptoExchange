import logo from '../assets/logo.png'
import ethLogo from '../assets/eth.svg'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Blockies from 'react-blockies'
import config from '../config.json';

import {
    loadAccount
} from '../store/interactions';

const Navbar = () => {
    const provider = useSelector(state => state.provider.connection)
    const chainId = useSelector(state => state.provider.chainId)
    const account = useSelector(state => state.provider.account)
    const balance = useSelector(state => state.provider.balance)

    const dispatch = useDispatch()

    const connectHandler = async () => {
        await loadAccount(provider, dispatch)
    }

    const networkHandler = async (e) => {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: e.target.value }],
        })
    }

    return (
        <div className='exchange__header grid'>
            <div className='exchange__header--brand flex'>
                <img src={logo} className='logo' alt='tokETH Logo'></img>
                <h1>tokETH Token Exchange</h1>
            </div>

            <div className='exchange__header--networks flex'>
                <img src={ethLogo} className='logo' alt='ethLogo Logo'></img>
                <select name="networks" id="networks" value={config[chainId] ? `0x${chainId.toString(16)}` : `0`} onChange={networkHandler}>
                    <option value="0">Select Network</option>
                    <option value="0x7a69">Localhost</option>
                    <option value="0x5">Goerli Testnet</option>
                </select>
            </div>
            {/*
            chain id
            Ethereum :"0x1",
            Local Chain :"0x539",
            Ropsten Testnet :"0x3",
            Rinkeby Testnet :"0x4",
            Kovan Testnet :"0x2a",
            Goerli Testnet :"0x5",
            Binance :"0x38",
            Smart Chain Testnet :"0x61",
            Polygon :"0x89",
            Mumbai :"0x13881",
            Avalanche" : "0xa86a",
            */}

            <div className='exchange__header--account flex'>

                {balance ? (<p><small>My Balance {Number(balance).toFixed(4)}</small></p>) : '0 ETH'}

                {account ? (
                    <a href={config[chainId] ? `${config[chainId].explorerURL}/address/${account}` : `#`}
                        target='_blank'
                        rel='noreferrer'>{account.slice(0, 5) + '...' + account.slice(38, 42)}
                        <Blockies
                            seed={account}
                            className="identicon"
                            size={7}
                            scale={3}
                            color="#2187D0"
                            bgColor="#F1F2F9"
                            spotColor="#767F92"
                        />
                    </a>
                ) : (
                    <button className='button' onClick={connectHandler}>Connect</button>
                )}
            </div>
        </div>
    )
}

export default Navbar;