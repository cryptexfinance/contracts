// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "./iOVM_CrossDomainMessenger.sol";

/**
 * @title TCAP Optimistic Treasury
 * @author Cryptex.finance
 * @notice This contract will hold the assets generated by the optimism network.
 */
contract OptimisticTreasury {

	/// @notice Address of the account able to make changes to the contract.
	address public owner;

	/// @notice Address of the optimistic ovmL2CrossDomainMessenger contract.
	iOVM_CrossDomainMessenger public immutable ovmL2CrossDomainMessenger;

	/// @notice An event emitted when a transaction is executed
	event TransactionExecuted(
		address indexed target,
		uint256 value,
		string signature,
		bytes data
	);

	/// @notice An event emitted when ownership is transferred
	event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


	/**
	 * @notice Constructor
	 * @param _owner the owner of the contract
	 * @param _ovmL2CrossDomainMessenger address of the optimism ovmL2CrossDomainMessenger
	 */
	constructor(address _owner, address _ovmL2CrossDomainMessenger) {
		require(
			_owner != address(0) && _ovmL2CrossDomainMessenger != address(0),
			"OptimisticTreasury::constructor: address can't be zero"
		);
		owner = _owner;
		ovmL2CrossDomainMessenger = iOVM_CrossDomainMessenger(_ovmL2CrossDomainMessenger);
	}


	/**
   * @dev Leaves the contract without owner. It will not be possible to call
 	 * `onlyOwner` functions anymore. Can only be called by the current owner.
   *
   * NOTE: Renouncing ownership will leave the contract without an owner,
   * thereby removing any functionality that is only available to the owner.
   */
	function renounceOwnership() public virtual onlyOwner {
		emit OwnershipTransferred(owner, address(0));
		owner = address(0);
	}

	/**
	  * @dev Transfers ownership of the contract to a new account (`newOwner`).
	  * Can only be called by the current owner.
	  */
	function transferOwnership(address newOwner) public virtual onlyOwner {
		require(newOwner != address(0), "Ownable: new owner is the zero address");
		emit OwnershipTransferred(owner, newOwner);
		owner = newOwner;
	}

	// @notice Throws if called by an account different from the owner
	// @dev call needs to come from ovmL2CrossDomainMessenger
	modifier onlyOwner() {
		require(
			msg.sender == address(ovmL2CrossDomainMessenger)
			&& ovmL2CrossDomainMessenger.xDomainMessageSender() == owner, "Ownable: caller is not the owner"
		);
		_;
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
	) external payable onlyOwner returns (bytes memory) {
		bytes memory callData;
		if (bytes(signature).length == 0) {
			callData = data;
		} else {
			callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
		}

		require(
			target != address(0),
			"OptimisticTreasury::executeTransaction: target can't be zero"
		);

		// solium-disable-next-line security/no-call-value
		(bool success, bytes memory returnData) =
		target.call{value : value}(callData);
		require(
			success,
			"OptimisticTreasury::executeTransaction: Transaction execution reverted."
		);

		emit TransactionExecuted(target, value, signature, data);
		(target, value, signature, data);

		return returnData;
	}

	/**
	 * @notice Retrieves the eth stuck on the treasury
	 * @param _to address
	 * @dev Only owner can call it
	 */
	function retrieveETH(address _to) external onlyOwner {
		require(
			_to != address(0),
			"OptimisticTreasury::retrieveETH: address can't be zero"
		);
		uint256 amount = address(this).balance;
		payable(_to).transfer(amount);
	}

	/// @notice Allows the contract to receive ETH
	receive() external payable {}
}