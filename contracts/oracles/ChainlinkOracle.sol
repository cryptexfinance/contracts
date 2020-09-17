// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";

contract ChainlinkOracle is Ownable, IERC165 {
  AggregatorInterface internal ref;

  using SafeCast for int256;

  /*
   * setReferenceContract.selector ^
   * getLatestAnswer.selector ^
   * getLatestTimestamp.selector ^
   * getPreviousAnswer.selector ^
   * getPreviousTimestamp.selector =>  0x85be402b
   */
  bytes4 private constant _INTERFACE_ID_CHAINLINK_ORACLE = 0x85be402b;

  /*
   * bytes4(keccak256('supportsInterface(bytes4)')) == 0x01ffc9a7
   */
  bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;

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

  //Supports interface
  function supportsInterface(bytes4 interfaceId)
    external
    override
    view
    returns (bool)
  {
    return (interfaceId == _INTERFACE_ID_CHAINLINK_ORACLE ||
      interfaceId == _INTERFACE_ID_ERC165);
  }
}
