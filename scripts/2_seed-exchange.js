const { ethers } = require("hardhat")
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether');
}

const config = require('../src/config.json')

const wait = (seconds) => {
    const milliseconds = seconds * 1000;
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
    //Fetch accounts
    const accounts = await ethers.getSigners()

    // Fetch network
    const { chainId } = await ethers.provider.getNetwork()
    console.log("Using chainId:", chainId)

    //Fetch contarcts
    const tokETH = await ethers.getContractAt('Token', config[chainId].tokETH.address)
    console.log(`tokETH Fetched: ${tokETH.address}\n`)

    const tokHAR = await ethers.getContractAt('Token', config[chainId].tokHAR.address)
    console.log(`tokHAR Fetched: ${tokHAR.address}\n`)

    const tokRAM = await ethers.getContractAt('Token', config[chainId].tokRAM.address)
    console.log(`tokRAM Fetched: ${tokRAM.address}\n`);

    //Fetch Exchange
    const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address)
    console.log(`exchange Fetched: ${exchange.address}\n`);

    //Give tokens to account[1]
    const sender = accounts[0]
    const receiver = accounts[1]
    let amount = tokens(10000);

    //user 1 transfer 10,000 tokHAR
    let transaction, result
    transaction = await tokHAR.connect(sender).transfer(receiver.address, amount);
    await transaction.wait();
    console.log(`Transferred ${amount} tokens(tokHAR) from ${sender.address} to ${receiver.address}\n`)

    //setup exchange user.
    const user1 = accounts[0];
    const user2 = accounts[1];
    amount = tokens(10000);

    //user 1 approve 10,000 tokETH
    transaction = await tokETH.connect(user1).approve(exchange.address, amount);
    await transaction.wait();
    console.log(`Approved ${amount} tokens from ${user1.address}\n`)

    //user 1 deposite 10,000 tokETH
    transaction = await exchange.connect(user1).depositToken(tokETH.address, amount);
    await transaction.wait();
    console.log(`Deposited ${amount} ether from ${user1.address}\n`)

    //user 2 approve 10,000 tokHAR
    transaction = await tokHAR.connect(user2).approve(exchange.address, amount);
    await transaction.wait();
    console.log(`Approved ${amount} tokens from ${user2.address}\n`)

    //user 2 deposite 10,000 tokETH
    transaction = await exchange.connect(user2).depositToken(tokHAR.address, amount);
    await transaction.wait();
    console.log(`Deposited ${amount} tokens from ${user2.address}\n`)

    //////////////////////////////////////////
    // Seed a cancel orders

    //User1 makes an order to get tokens
    let orderId
    transaction = await exchange.connect(user1).makeOrder(tokHAR.address, tokens(100), tokETH.address, tokens(5));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}\n`)

    //User1 cancell the order
    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user1).cancelOrder(orderId);
    result = await transaction.wait();
    console.log(`Cancelled orderid (${orderId}) from ${user1.address}\n`)

    //Wait 1 sec
    await wait(1);

    //////////////////////////////////////////
    // Seed filled orders

    //User1 makes an order
    transaction = await exchange.connect(user1).makeOrder(tokHAR.address, tokens(100), tokETH.address, tokens(5));
    result = await transaction.wait();
    console.log(`User1 makes an order ${user1.address}\n`)


    //User2 fill the order
    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrders(orderId);
    result = await transaction.wait();
    console.log(`User2 fill the order  ${user2.address}\n`)

    //Wait 1 sec
    await wait(1);

    //User1 makes another order
    transaction = await exchange.connect(user1).makeOrder(tokHAR.address, tokens(50), tokETH.address, tokens(15));
    result = await transaction.wait();
    console.log(`User1 makes another order ${user1.address}\n`)

    //User2 fill the order again
    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrders(orderId);
    result = await transaction.wait();
    console.log(`User2 fill the order again ${user2.address}\n`)

    //Wait 1 sec
    await wait(1);

    //User1 makes final order
    transaction = await exchange.connect(user1).makeOrder(tokHAR.address, tokens(200), tokETH.address, tokens(20));
    result = await transaction.wait();
    console.log(`User1 makes final order ${user1.address}\n`)


    //User2 fill final order
    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrders(orderId);
    result = await transaction.wait();
    console.log(`User2 fill final order  ${user2.address}\n`)
    await wait(1);

    //////////////////////////////////////////
    // Seed Open orders
    // User 1 makes 10 orders
    for (let i = 1; i <= 10; i++) {
        transaction = await exchange.connect(user1).makeOrder(tokHAR.address, tokens(10 * i), tokETH.address, tokens(10))
        result = await transaction.wait()

        console.log(`Made order from (user 1) ${user1.address}`)

        // Wait 1 second
        await wait(1)
    }

    // User 2 makes 10 orders
    for (let i = 1; i <= 10; i++) {
        transaction = await exchange.connect(user2).makeOrder(tokETH.address, tokens(10), tokHAR.address, tokens(10 * i))
        result = await transaction.wait()
        console.log(`Made order from (user 2) ${user2.address}`)
        // Wait 1 second
        await wait(1)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
