// SPDX-License-Identifier: UNLICENSED
/** @notice this contract is for tests only */

pragma solidity ^0.6.8;


contract Oracle {
  uint256 public price;

  constructor(uint256 _price) public {
    price = _price;
  }

  function setPrice(uint256 _price) public {
    price = _price;
  }
}
