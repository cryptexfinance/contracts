// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

contract AggregatorInterfaceTCAP {
  int256 value = 37129732288636297500;

  function latestAnswer() public view virtual returns (int256) {
    return value;
  }

  function latestRoundData()
    public
    view
    virtual
    returns (
      uint80,
      int256,
      uint256,
      uint256,
      uint80
    )
  {
    return (
      55340232221128679816,
      value,
      1616543796,
      1616543819,
      55340232221128679816
    );
  }

  function setLatestAnswer(int256 _tcap) public {
    value = _tcap;
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
