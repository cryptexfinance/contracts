// SPDX-License-Identifier: UNLICENSED
/** @dev This contract is for testing only */
pragma solidity ^0.6.4;

import "../IRToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//Testing
import "@nomiclabs/buidler/console.sol";


contract RToken is ERC20, Ownable {
  IERC20 public DAI;

  constructor(IERC20 _DAI) public ERC20("rDAI TEST", "rDAI") {
    DAI = _DAI;
  }

  function mint(uint256 _amount) public returns (bool) {
    DAI.transferFrom(msg.sender, address(this), _amount);
    _mint(msg.sender, _amount);
    return true;
  }

  function redeem(uint256 _amount) public returns (bool) {
    DAI.transfer(msg.sender, _amount);
    _burn(msg.sender, _amount);
    return true;
  }

  function redeemAndTransfer(address _owner, uint256 _amount)
    public
    returns (bool)
  {
    DAI.transfer(_owner, _amount);
    _burn(msg.sender, _amount);
    return true;
  }

  function payInterest(address owner) external virtual returns (bool) {
    return true;
  }

  function interestPayableOf(address owner)
    external
    virtual
    view
    returns (uint256 amount)
  {
    amount = 0;
  }
}
