// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0;


contract AggregatorInterface {
  int256 value = 39752768946;

  function latestAnswer() public virtual view returns (int256) {
    return value;
  }

  function latestTimestamp() public virtual view returns (uint256) {
    return 0;
  }

  function latestRound() public virtual view returns (uint256) {
    return 0;
  }

  function getAnswer(uint256 roundId) public virtual view returns (int256) {
    return 0;
  }

  function getTimestamp(uint256 roundId) public virtual view returns (uint256) {
    return 0;
  }

  event AnswerUpdated(
    int256 indexed current,
    uint256 indexed roundId,
    uint256 timestamp
  );
  event NewRound(
    uint256 indexed roundId,
    address indexed startedBy,
    uint256 startedAt
  );
}
