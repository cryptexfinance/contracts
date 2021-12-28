// SPDX-License-Identifier: MIT
/** @notice this contract is for tests only */

pragma solidity 0.7.5;


contract OVML2CrossDomainMessenger {

	address public xDomainMessageSender;

	constructor(address _xDomainMessageSender){
		xDomainMessageSender = _xDomainMessageSender;

	}

	/**
	 * @notice Allows the owner to execute custom transactions
	 * @param target address
	 * @param value uint256
	 * @param signature string
	 * @param data bytes
	 * @dev Only owner can call it
	 */
	function executeTransaction(
		address target,
		uint256 value,
		string memory signature,
		bytes memory data
	) external payable returns (bytes memory) {
		bytes memory callData;
		if (bytes(signature).length == 0) {
			callData = data;
		} else {
			callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
		}

		require(
			target != address(0),
			"OVML2CrossDomainMessenger::executeTransaction: target can't be zero"
		);
		
		// solium-disable-next-line security/no-call-value
		(bool success, bytes memory returnData) =
		target.call{value : value}(callData);
		require(
			success,
			"OVML2CrossDomainMessenger::executeTransaction: Transaction execution reverted."
		);

		(target, value, signature, data);

		return returnData;
	}
}
