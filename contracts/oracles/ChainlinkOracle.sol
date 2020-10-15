// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";

/**
 * @title TCAP Vault Handler
 * @author Cristian Espinoza
 * @notice Contract in charge or reading the information from a Chainlink Oracle. TCAP contracts read the price directly from this contract. More information can be found on Chainlink Documentation
 */
contract ChainlinkOracle is Ownable, IERC165 {
  AggregatorV3Interface internal ref;

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

  /**
   * @notice Called once the contract it's deployed.
   * Set the Chainlink Oracle as an aggregator.
   */
  constructor(address _aggregator) public {
    ref = AggregatorV3Interface(_aggregator);
  }

  /**
   * @notice Changes the reference contract.
   * @dev Only owner can call it.
   */
  function setReferenceContract(address _aggregator) public onlyOwner() {
    ref = AggregatorV3Interface(_aggregator);
  }

  /**
   * @notice Returns the latest answer from the referece contract.
   * @return price
   */
  function getLatestAnswer() public view returns (int256 price) {
    (, price, , , ) = ref.latestRoundData();
  }

  /**
   * @notice Returns the latest round from the referece contract.
   */
  function getLatestRound()
    public
    view
    returns (
      uint80,
      int256,
      uint256,
      uint256,
      uint80
    )
  {
    (
      uint80 roundID,
      int256 price,
      uint256 startedAt,
      uint256 timeStamp,
      uint80 answeredInRound
    ) = ref.latestRoundData();

    return (roundID, price, startedAt, timeStamp, answeredInRound);
  }

  /**
   * @notice Returns the latest round from the referece contract.
   * @param _id of round
   */
  function getRound(uint80 _id)
    public
    view
    returns (
      uint80,
      int256,
      uint256,
      uint256,
      uint80
    )
  {
    (
      uint80 roundID,
      int256 price,
      uint256 startedAt,
      uint256 timeStamp,
      uint80 answeredInRound
    ) = ref.getRoundData(_id);

    return (roundID, price, startedAt, timeStamp, answeredInRound);
  }

  /**
   * @notice Returns the last time the Oracle was updated.
   */
  function getLatestTimestamp() public view returns (uint256) {
    (, , , uint256 timeStamp, ) = ref.latestRoundData();
    return timeStamp;
  }

  /**
   * @notice Returns the previous answer updated on the Oracle.
   * @param _id of round
   * @return price
   */
  function getPreviousAnswer(uint80 _id) public view returns (int256) {
    (uint80 roundID, int256 price, , , ) = ref.getRoundData(_id);
    require(_id <= roundID, "Not enough history");
    return price;
  }

  /**
   * @notice Returns the previous time the Oracle was updated.
   * @param _id of round
   * @return timeStamp
   */
  function getPreviousTimestamp(uint80 _id) public view returns (uint256) {
    (uint80 roundID, , , uint256 timeStamp, ) = ref.getRoundData(_id);
    require(_id <= roundID, "Not enough history");
    return timeStamp;
  }

  /**
   * @notice ERC165 Standard for support of interfaces.
   */
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
