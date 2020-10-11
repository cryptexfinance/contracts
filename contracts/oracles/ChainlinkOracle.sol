// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";


/**
 * @title TCAP Vault Handler
 * @author Cristian Espinoza
 * @notice Contract in charge or reading the information from a Chainlink Oracle. TCAP contracts read the price directly from this contract. More information can be found on Chainlink Documentation
 */
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

	/**
	 * @notice Called once the contract it's deployed.
	 * Set the Chainlink Oracle as an aggregator.
	 */
  constructor(address _aggregator) public {
    ref = AggregatorInterface(_aggregator);
  }


	/**
	 * @notice Changes the reference contract.
 	 * @dev Only owner can call it.
	 */
  function setReferenceContract(address _aggregator) public onlyOwner() {
    ref = AggregatorInterface(_aggregator);
  }

   /**
		* @notice Returns the latest answer from the referece contract.
		* @dev multiplied by 10000000000 for handling decimals.
		*/
  function getLatestAnswer() public view returns (uint256) {
    uint256 result = (ref.latestAnswer() * 10000000000).toUint256();
    return result;
  }
	 /**
		* @notice Returns the last time the Oracle was updated.
		*/
  function getLatestTimestamp() public view returns (uint256) {
    return ref.latestTimestamp();
  }

	 /**
		* @notice Returns the previous answer updated on the Oracle.
		*/
  function getPreviousAnswer(uint256 _back) public view returns (int256) {
    uint256 latest = ref.latestRound();
    require(_back <= latest, "Not enough history");
    return ref.getAnswer(latest - _back);
  }

	 /**
		* @notice Returns the previous time the Oracle was updated.
		*/
  function getPreviousTimestamp(uint256 _back) public view returns (uint256) {
    uint256 latest = ref.latestRound();
    require(_back <= latest, "Not enough history");
    return ref.getTimestamp(latest - _back);
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
