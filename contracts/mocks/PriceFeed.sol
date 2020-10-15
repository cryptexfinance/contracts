// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

contract PriceFeed {
  uint256 val;
  uint32 public zzz;
  address public med;

  function read() public view returns (bytes32) {
    return bytes32(val);
  }

  function post(
    uint256 val_,
    uint32 zzz_,
    address med_
  ) public virtual {
    val = val_;
    zzz = zzz_;
    med = med_;
  }
}
