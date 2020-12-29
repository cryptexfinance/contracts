// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0;

contract AggregatorInterfaceTCAP {
  int256 value = 37129732288636297500;

  function latestAnswer() public virtual view returns (int256) {
    return value;
  }

  function latestRoundData()
    public
    virtual
    view
    returns (
      uint80,
      int256,
      uint256,
      uint256,
      uint80
    )
  {
    return (0, value, 0, 0, 0);
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
