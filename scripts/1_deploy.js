const { ethers } = require("hardhat")

async function main() {
  console.log(`Prepairing deployment...\n`);

  // Fetch contract to deploy
  const Token = await ethers.getContractFactory('Token')
  const Exchange = await ethers.getContractFactory('Exchange')

  //Fetch accounts
  const accounts = await ethers.getSigners()
  console.log(`Accounts fetched : \n${accounts[0].address}\n${accounts[1].address}\n${accounts[2].address}\n${accounts[3].address}\n${accounts[4].address}\n${accounts[5].address}\n${accounts[6].address}\n${accounts[7].address}\n${accounts[8].address}\n${accounts[9].address}\n${accounts[10].address}\n${accounts[0].address}\n${accounts[0].address}`)


  // Deploy Token
  const tokETH = await Token.deploy('tokenETH', 'tokETH', '1000000')
  await tokETH.deployed()
  console.log(`tokETH Deployed to: ${tokETH.address}`)


  const tokHAR = await Token.deploy('tokenHar', 'tokHAR', '1000000')
  await tokHAR.deployed()
  console.log(`tokHAR Deployed to: ${tokHAR.address}`)

  const tokRAM = await Token.deploy('tokenRam', 'tokRAM', '1000000')
  await tokRAM.deployed()
  console.log(`tokRAM Deployed to: ${tokRAM.address}`)

  //Deploy Exchange
  const exchange = await Exchange.deploy(accounts[1].address, 10)
  await exchange.deployed()
  console.log(`Exchange Deployed to: ${exchange.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
