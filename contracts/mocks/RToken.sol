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
  IERC20 public rDAI;

  constructor(IERC20 _rDAI) public ERC20("rDAI TEST", "rDAI") {
    rDAI = _rDAI;
  }

  function mint(uint256 _amount) public returns (bool) {
    rDAI.transferFrom(msg.sender, address(this), _amount);
    _mint(msg.sender, _amount);
    return true;
  }

  function redeem(uint256 _amount) public returns (bool) {
    rDAI.transfer(msg.sender, _amount);
    _burn(msg.sender, _amount);
    return true;
  }

  function redeemAndTransfer(address _owner, uint256 _amount)
    public
    returns (bool)
  {
    rDAI.transfer(_owner, _amount);
    _burn(msg.sender, _amount);
    return true;
  }
}
