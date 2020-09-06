// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";

contract ChainlinkOracle is Ownable {
  AggregatorInterface internal ref;

  using SafeCast for int256;

  constructor(address _aggregator) public {
    ref = AggregatorInterface(_aggregator);
  }

  function setReferenceContract(address _aggregator) public onlyOwner() {
    ref = AggregatorInterface(_aggregator);
  }

  //Multiplies by 10000000000 to handle decimals
  function getLatestAnswer() public view returns (uint256) {
    uint256 result = (ref.latestAnswer() * 10000000000).toUint256();
    return result;
  }

  function getLatestTimestamp() public view returns (uint256) {
    return ref.latestTimestamp();
  }

  function getPreviousAnswer(uint256 _back) public view returns (int256) {
    uint256 latest = ref.latestRound();
    require(_back <= latest, "Not enough history");
    return ref.getAnswer(latest - _back);
  }

  function getPreviousTimestamp(uint256 _back) public view returns (uint256) {
    uint256 latest = ref.latestRound();
    require(_back <= latest, "Not enough history");
    return ref.getTimestamp(latest - _back);
  }
}
