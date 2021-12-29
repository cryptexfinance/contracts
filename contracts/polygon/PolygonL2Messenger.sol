// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;


import "fx-portal-contracts/contracts/FxChild.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Context } from "@openzeppelin/contracts/GSN/Context.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract PolygonL2Messenger is
	IFxMessageProcessor,
	Ownable,
	ReentrancyGuard {
	/// @notice Address of the contract that is allowed to make calls to this contract.
	address public fxRootSender;

	/// @notice Address of the polygon FxChild contract.
	address public fxChild;

	/// @notice An event emitted when the fxRootSender is updated
	event FxRootSenderUpdate(address previousFxRootSender, address newFxRootSender);

	/// @notice An event emitted when the fxChild is updated
  event FxChildUpdate(address previousFxChild, address newFxChild);

	// The default x-domain message sender being set to a non-zero value makes
	// deployment a bit more expensive, but in exchange the refund on every call to
	// `processMessageFromRoot` by the L1 and L2 messengers will be higher.
	address internal constant DEFAULT_XDOMAIN_SENDER = 0x000000000000000000000000000000000000dEaD;

	/// @notice temporarily stores the cross domain sender address when processMessageFromRoot is called
	address public xDomainMsgSender = DEFAULT_XDOMAIN_SENDER;

	/// @notice address of the contract will receive the cross domain messages
	address public messageReceiver;

	/// @notice An event emitted when the messageReceiver is updated
  event MessageReceiverUpdate(address previousMsgReceiver, address newMsgReceiver);

	/// @notice map that stores the hash messages that are successfully executed
	mapping (bytes32 => bool) public successfulMessages;

	/**
   * @notice Throws if called by any account other than the fxChild.
  */
	modifier onlyFxChild() {
    require(msg.sender == fxChild, 'UNAUTHORIZED_CHILD_ORIGIN');
    _;
  }

	/// @inheritdoc IFxMessageProcessor
	function processMessageFromRoot(
		uint256 stateId,
		address rootMessageSender,
		bytes calldata data
	) override
		nonReentrant
		onlyFxChild
		external {
		require(
			messageReceiver != address(0),
			"messageReceiver has not been set"
		);
		require(rootMessageSender == fxRootSender, 'UNAUTHORIZED_ROOT_ORIGIN');

		bytes memory xDomainCalldata = abi.encodeWithSignature(
			"processMessageFromRoot(uint256,address,bytes)",
			stateId,
			rootMessageSender,
			data
		);
		bytes32 xDomainCalldataHash = keccak256(xDomainCalldata);

		require(
			successfulMessages[xDomainCalldataHash] == false,
			"Provided message has already been received."
    );

		xDomainMsgSender = rootMessageSender;
		(bool success, ) = messageReceiver.call(data);
		xDomainMsgSender = DEFAULT_XDOMAIN_SENDER;

		if (success == true) {
			successfulMessages[xDomainCalldataHash] = true;
		}
	}

	/**
   * @dev Get the xDomainMsgSender address
   * @return xDomainMsgSender the address that sent the cross-domain transaction
  **/
	function xDomainMessageSender()
		public
		view
		returns (
				address
		) {
			require(xDomainMsgSender != DEFAULT_XDOMAIN_SENDER, "xDomainMessageSender is not set");
			return xDomainMsgSender;
	}

	/**
   * @dev Updates the address of PolygonL2Messenger contract
   * @param msgReceiver address of the L2 contract that will execute the received message - likely the cryptex orchestartor
   **/
	function setMessageReceiver(address msgReceiver) external onlyOwner {
		emit MessageReceiverUpdate(messageReceiver, msgReceiver);
		messageReceiver = msgReceiver;
	}

	/**
   * @dev Update the expected address of contract originating from a cross-chain transaction
   * @param _fxRootSender contract originating a cross-chain transaction- likely the cryptex timelock
   **/
  function updateFxRootSender(address _fxRootSender) external onlyOwner {
    emit FxRootSenderUpdate(fxRootSender, _fxRootSender);
    fxRootSender = _fxRootSender;
  }

  /**
   * @dev Update the address of the FxChild contract
   * @param _fxChild the address of the contract used to foward cross-chain transactions on Polygon
   **/
  function updateFxChild(address _fxChild) external onlyOwner {
    emit FxChildUpdate(fxChild, _fxChild);
    fxChild = _fxChild;
  }
}
