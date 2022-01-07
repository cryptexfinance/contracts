// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Context } from "@openzeppelin/contracts/GSN/Context.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// IFxMessageProcessor represents interface to process message
interface IFxMessageProcessor {
    function processMessageFromRoot(
			uint256 stateId,
			address rootMessageSender,
			bytes calldata data
		) external;
}

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

	/// @notice map that stores addresses that are approved to receive messages
	mapping (address => bool) public registeredReceivers;

	/// @notice An event emitted when approval for an address to receive messages is changed
	event RegistrationUpdated(address receiver, bool approve);

	/**
   * @notice Throws if called by any account other than the fxChild.
  **/
	modifier onlyFxChild() {
    require(msg.sender == fxChild, 'UNAUTHORIZED_CHILD_ORIGIN');
    _;
  }

	/// @inheritdoc IFxMessageProcessor
	function processMessageFromRoot(
		uint256, /* stateId */
		address rootMessageSender,
		bytes calldata data
	) override
		nonReentrant
		onlyFxChild
		external {
		require(
			rootMessageSender == fxRootSender,
			"PolygonL2Messenger::processMessageFromRoot:UNAUTHORIZED_ROOT_ORIGIN"
		);

		(address target,  bytes memory callData) = abi.decode(data, (address, bytes));
		require(
			registeredReceivers[target],
			"PolygonL2Messenger::processMessageFromRoot:UNAUTHORIZED_RECEIVER"
		);

		xDomainMsgSender = rootMessageSender;
		(bool success, ) = target.call(callData);
		xDomainMsgSender = DEFAULT_XDOMAIN_SENDER;

		require(
      success,
      "PolygonL2Messenger::processMessageFromRoot: Message execution reverted."
    );
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
   * @dev updates the approval for an address to receive messages
   * @param receiver address of message receiver
   * @param approve flag that approves or disapproves a receiver
  **/
	function updateRegisteredReceivers(address receiver, bool approve) external onlyOwner {
			registeredReceivers[receiver] = approve;
			emit RegistrationUpdated(receiver, approve);
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
