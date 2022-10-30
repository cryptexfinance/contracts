// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { AddressAliasHelper } from "./AddressAliasHelper.sol";


contract L2MessageExecutor is ReentrancyGuard {

	/// @notice Address of the L1MessageRelayer contract on mainnet.
	address public l1MessageRelayer;

	constructor(address _l1MessageRelayer) {
		l1MessageRelayer = _l1MessageRelayer;
	}

	/**
	 * @notice Throws if called by any account other than this contract.
	**/
	modifier onlyThis() {
    require(msg.sender == address(this), "L2MessageExecutor: Unauthorized message sender");
    _;
  }

	/**
   * @dev Update the address of the L1MessageRelayer contract.
   * @param _l1MessageRelayer the address of L1 contract used to relay messsages to L2.
  **/
	function updateL2MessageRelayer(address _l1MessageRelayer) external onlyThis {
		require(
			_l1MessageRelayer != address(0),
			"L2MessageExecutor::updateL2MessageRelayer: _l1MessageRelayer is the zero address"
		);
		l1MessageRelayer = _l1MessageRelayer;
	}

	/**
   * @notice executes message received from L1.
   * @param payLoad message received from L1 that needs to be executed.
  **/
	function executeMessage(bytes calldata payLoad) external  nonReentrant{
		// To check that message came from L1, we check that the sender is the L1 contract's L2 alias.
		require(
				msg.sender == AddressAliasHelper.applyL1ToL2Alias(l1MessageRelayer),
				"L2MessageExecutor::executeMessage: Unauthorized message sender"
		);

		(address target,  bytes memory callData) = abi.decode(payLoad, (address, bytes));
		(bool success, ) = target.call(callData);
		require(
      success,
      "L2MessageExecutor::executeMessage: Message execution reverted."
    );

	}

}
