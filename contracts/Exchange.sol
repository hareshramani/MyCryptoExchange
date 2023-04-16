//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders; //Order mapping with struct _Order
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;
    uint256 orderCount; //intial value 0

    event Deposit(
        address _token,
        address _user,
        uint256 _amount,
        uint256 _balance
    );

    event Withdraw(
        address _token,
        address _user,
        uint256 _amount,
        uint256 _balance
    );

    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );

    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );

    // A way to model a order
    struct _Order {
        //Attribute of orders
        uint256 id; //make identifire for order
        address user; //user who made the order
        address tokenGet; //Address the token they receive
        uint256 amountGet; //amount they receive
        address tokenGive; //Address the token they give
        uint256 amountGive; //amount they give
        uint256 timestamp; //when order was created
    }

    event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address creator,
        uint256 timestamp
    );

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    //DEPOSITE AND WITHDRAW TOKEN
    //Deposite Token
    function depositToken(address _token, uint256 _amount) public {
        //Transfer tokens to exchanges
        Token(_token).transferFrom(msg.sender, address(this), _amount);
        //Update User Balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;
        //Emit Event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    //Deposite Token
    function withdrawToken(address _token, uint256 _amount) public {
        //Ensure user have enough tokens
        require(
            tokens[_token][msg.sender] >= _amount,
            "insufficient token balance in user acc"
        );
        //Transfer tokens to user
        Token(_token).transfer(msg.sender, _amount);
        //Update User Balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;
        //Emit Event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    //Check Balance
    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    function getOrderCount() public view returns (uint256) {
        return orderCount;
    }

    //-----------------
    //MAKE AND CANCEL ORDERs
    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        require(
            balanceOf(_tokenGive, msg.sender) >= _amountGet,
            "Insufficient token give with user"
        );
        //Token Give (token they want to spend) - which token,how much token
        //Token Get (token they want to receive) - which token,how much token

        //Require Token balances

        //CREATE ORDER
        orderCount++;
        orders[orderCount] = _Order(
            orderCount, //id 1,2,3
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp //epoch time
        );

        //EMIT ORDER EVENTs
        emit Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
    }

    function cancelOrder(uint256 _orderId) public {
        //Fetch the order
        _Order storage _order = orders[_orderId];
        //Order shouldn't be cancelled
        require(orderCancelled[_orderId] == false, "Order already cancelled");
        //Order must exists
        require(_order.id == _orderId, "Order not exists");
        //Ensure the called of the function is the owner of the order
        require(
            address(_order.user) == msg.sender,
            "Order owns by someone else"
        );

        //Cancell The Order
        orderCancelled[_orderId] = true;

        //EMIT ORDER Cancel EVENTs
        emit Cancel(
            _orderId,
            msg.sender,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            block.timestamp
        );
    }

    //-----------------
    //EXECUTING ORDERS
    function fillOrders(uint256 _orderId) public {
        //1.Order must be existss
        require(
            _orderId > 0 && _orderId <= orderCount,
            "Order does not exists"
        );
        //2.Order can't be filled
        require(!orderFilled[_orderId], "Order Already Filled");
        //3.Order can't be cancelled
        require(!orderCancelled[_orderId], "Order Cancelled");
        //Fetch the order
        _Order storage _order = orders[_orderId];
        //Swapping Tokens (Trading)
        _trade(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive
        );
        orderFilled[_order.id] = true;
    }

    function _trade(
        uint256 _orderId,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) internal {
        //Fee is paid by user who fill the order (msg.sender)
        //Fee is deducted from _amountGet
        uint256 _feeAmount = (feePercent * _amountGet) / 100;

        //Execute the order
        //msg.sender is the user who filled the order,while _user is who create the order
        tokens[_tokenGet][msg.sender] =
            tokens[_tokenGet][msg.sender] -
            (_amountGet + _feeAmount);
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user] + _amountGet;

        //Charge the fee
        tokens[_tokenGet][feeAccount] =
            tokens[_tokenGet][feeAccount] +
            _feeAmount;

        tokens[_tokenGive][_user] = tokens[_tokenGive][_user] - _amountGive;
        tokens[_tokenGive][msg.sender] =
            tokens[_tokenGive][msg.sender] +
            _amountGive;

        emit Trade(
            _orderId,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            _user,
            block.timestamp
        );
    }
}
