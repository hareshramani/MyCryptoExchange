const { expect } = require('chai');
const { ethers } = require('hardhat');
//const { transform } = require('lodash');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', () => {
  let deployer, feeAccount, exchange

  const feePercent = 10

  beforeEach(async () => {
    const Exchange = await ethers.getContractFactory('Exchange')
    const Token = await ethers.getContractFactory('Token')

    token1 = await Token.deploy("Haresh's Dai Token", 'hDai', '1000000')
    token2 = await Token.deploy("Ramani's Dai Token", 'rDai', '1000000')


    accounts = await ethers.getSigners()
    deployer = accounts[0]
    feeAccount = accounts[1]
    user1 = accounts[2]
    user2 = accounts[3]

    let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
    await transaction.wait()

    exchange = await Exchange.deploy(feeAccount.address, feePercent)
  })

  describe('Deployment', () => {

    it('tracks the fee account', async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address)
    })

    it('tracks the fee percent', async () => {
      expect(await exchange.feePercent()).to.equal(feePercent)
    })
  })

  describe('Depositing Tokens', () => {
    let transaction, result
    let amount = tokens(10)

    describe('Sucesss', async () => {
      beforeEach(async () => {
        //Approve Token
        transaction = await token1.connect(user1).approve(exchange.address, amount)
        result = await transaction.wait();

        //Deposit Token
        transaction = await exchange.connect(user1).depositToken(token1.address, amount)
        result = await transaction.wait();
      })

      it('tracks the balance of token1 on exchange', async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(amount)
        expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
      })

      it('emits a Deposit event', async () => {
        const event = result.events[1]//Multiple Events
        expect(event.event).to.equal('Deposit')

        const args = event.args
        expect(args._token).to.equal(token1.address)
        expect(args._user).to.equal(user1.address)
        expect(args._amount).to.equal(amount)
        expect(args._balance).to.equal(amount)
      })
      it('tracks the balance of token1 on exchange', async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(amount)
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
        expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
      })
    })
    describe('Fail', () => {
      it('Fails when no tokens approved', async () => {
        await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
      })

    })

  })

  describe('Withdrawing Tokens', () => {
    let transaction, result
    let amount = tokens(10)

    describe('Sucesss', async () => {
      beforeEach(async () => {
        //Deposite Token to withdraw
        //Approve Token
        transaction = await token1.connect(user1).approve(exchange.address, amount)
        result = await transaction.wait();

        //Deposit Token
        transaction = await exchange.connect(user1).depositToken(token1.address, amount)
        result = await transaction.wait();

        //Withdraw Token Funds
        transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
        result = await transaction.wait();
        //Withdraw tokens
      })

      it('withdraw token funds', async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(0)
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
        expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
      })

      it('emits a Withdraw event', async () => {
        const event = result.events[1]//Multiple Events
        expect(event.event).to.equal('Withdraw')

        const args = event.args
        expect(args._token).to.equal(token1.address)
        expect(args._user).to.equal(user1.address)
        expect(args._amount).to.equal(amount)
        expect(args._balance).to.equal(0)
      })


    })
    describe('Fail', () => {
      it('Fails for insufficient balance', async () => {
        //Attempting to withdraw tokens without depositing
        await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted
      })

    })

  })

  describe('Checking Balance', () => {
    let transaction, result
    let amount = tokens(1)

    beforeEach(async () => {
      //Approve Token
      transaction = await token1.connect(user1).approve(exchange.address, amount)
      result = await transaction.wait();

      //Deposit Token
      transaction = await exchange.connect(user1).depositToken(token1.address, amount)
      result = await transaction.wait();
    })

    it('return user balance', async () => {
      expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
    })

  })

  describe('Making Orders', async () => {
    let transaction, result
    let amount = tokens(1)
    describe('Success', async () => {
      beforeEach(async () => {
        //Depositing tokens before making orders
        //Approve Token
        transaction = await token1.connect(user1).approve(exchange.address, amount)
        result = await transaction.wait();

        //Deposit Token
        transaction = await exchange.connect(user1).depositToken(token1.address, amount)
        result = await transaction.wait();

        //make Orders
        transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
        result = await transaction.wait();

      })

      it('track the newly created order', async () => {
        expect(await exchange.getOrderCount()).to.equal(1);
      })
      it('emits a order event', async () => {
        const event = result.events[0]//Multiple Events
        expect(event.event).to.equal('Order')

        const args = event.args
        expect(args.id).to.equal(1)
        expect(args.user).to.equal(user1.address)
        expect(args.tokenGet).to.equal(token2.address)
        expect(args.amountGet).to.equal(amount)
        expect(args.tokenGive).to.equal(token1.address)
        expect(args.amountGive).to.equal(amount)
        expect(args.timestamp).to.at.least(1)
      })


    })

    describe('Failure', async () => {
      it('Rejects with no balance', async () => {
        await expect(exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))).to.be.reverted;
      })

    })

  })

  describe('Orders Action', async () => {
    let transaction, result
    let amount = tokens(1)
    beforeEach(async () => {
      //Depositing tokens for user 1
      transaction = await token1.connect(user1).approve(exchange.address, amount)
      result = await transaction.wait();

      transaction = await exchange.connect(user1).depositToken(token1.address, amount)
      result = await transaction.wait();

      // Give tokens to user2
      transaction = await token2.connect(deployer).transfer(user2.address, tokens(100))
      result = await transaction.wait()

      // user2 deposits tokens
      transaction = await token2.connect(user2).approve(exchange.address, tokens(2))
      result = await transaction.wait()

      transaction = await exchange.connect(user2).depositToken(token2.address, tokens(2))
      result = await transaction.wait()

      //make Orders
      transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
      result = await transaction.wait();
    })

    describe('Cancelling orders', async () => {
      describe('Success', async () => {
        beforeEach(async () => {
          transaction = await exchange.connect(user1).cancelOrder(1)
          result = await transaction.wait()
        })

        it('updates canceled orders', async () => {
          expect(await exchange.orderCancelled(1)).to.equal(true)
        })

        it('emits a Cancel event', async () => {
          const event = result.events[0]
          expect(event.event).to.equal('Cancel')

          const args = event.args
          expect(args.id).to.equal(1)
          expect(args.user).to.equal(user1.address)
          expect(args.tokenGet).to.equal(token2.address)
          expect(args.amountGet).to.equal(tokens(1))
          expect(args.tokenGive).to.equal(token1.address)
          expect(args.amountGive).to.equal(tokens(1))
          expect(args.timestamp).to.at.least(1)
        })

      })

      describe('Failure', async () => {
        beforeEach(async () => {
          // user1 deposits tokens
          transaction = await token1.connect(user1).approve(exchange.address, amount)
          result = await transaction.wait()
          transaction = await exchange.connect(user1).depositToken(token1.address, amount)
          result = await transaction.wait()
          // Make an order
          transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
          result = await transaction.wait()
        })

        it('rejects invalid order ids', async () => {
          const invalidOrderId = 99999
          await expect(exchange.connect(user1).cancelOrder(invalidOrderId)).to.be.reverted
        })

        it('rejects unauthorized cancelations', async () => {
          await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
        })

      })

    })

    describe('filling Orders', async () => {
      describe('Success', async () => {
        beforeEach(async () => {
          //User2 Fill Orders
          transaction = await exchange.connect(user2).fillOrders('1')
          result = await transaction.wait();
        })
        it('executes the trade and charge fees', async () => {
          // Token Give
          expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(tokens(0))
          expect(await exchange.balanceOf(token1.address, user2.address)).to.equal(tokens(1))
          expect(await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(tokens(0))
          // Token get
          expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(tokens(1))
          expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(tokens(0.9))
          expect(await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(tokens(0.1))
        })

        it('updates filled orders', async () => {
          expect(await exchange.orderFilled(1)).to.equal(true)
        })

        it('emits a Trade event', async () => {
          const event = result.events[0]
          expect(event.event).to.equal('Trade')

          const args = event.args
          expect(args.id).to.equal(1)
          expect(args.user).to.equal(user2.address)
          expect(args.tokenGet).to.equal(token2.address)
          expect(args.amountGet).to.equal(tokens(1))
          expect(args.tokenGive).to.equal(token1.address)
          expect(args.amountGive).to.equal(tokens(1))
          expect(args.creator).to.equal(user1.address)
          expect(args.timestamp).to.at.least(1)
        })

      })
      describe('Failure', async () => {


        it('rejects invalid order ids', async () => {
          const invalidOrderId = 99999
          await expect(exchange.connect(user2).fillOrders(invalidOrderId)).to.be.reverted
        })

        it('rejects already filled orders', async () => {
          transaction = await exchange.connect(user2).fillOrders(1)
          await transaction.wait()

          await expect(exchange.connect(user2).fillOrders(1)).to.be.reverted
        })

        it('Rejects canceled orders', async () => {
          transaction = await exchange.connect(user1).cancelOrder(1)
          await transaction.wait()

          await expect(exchange.connect(user2).fillOrders(1)).to.be.reverted
        })


      })
    })

  })







})