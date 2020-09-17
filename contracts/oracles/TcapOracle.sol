// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TcapOracle is Ownable {
  uint256 internal tcap;

  function setLatestAnswer(uint256 _tcap) public onlyOwner() {
    tcap = _tcap;
  }

  function getLatestAnswer() public view returns (uint256) {
    return tcap;
  }
}
