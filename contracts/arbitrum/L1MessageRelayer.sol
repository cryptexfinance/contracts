// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "@arbitrum/nitro-contracts/src/bridge/IInbox.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./L2MessageExecutor.sol";

contract L1MessageRelayer is Ownable {
  /// @notice Address of the governance TimeLock contract.
  address public timeLock;

  /// @notice Address of the L2MessageExecutorProxy contract on arbitrum.
  address public l2MessageExecutorProxy;

  /// @notice Address of arbitrum's L1 inbox contract.
  IInbox public inbox;

  /// @notice Emitted when a retryable ticket is created for relaying L1 message to L2.
  event RetryableTicketCreated(uint256 indexed ticketId);

  /// @notice Throws if called by any account other than the timeLock contract.
  modifier onlyTimeLock() {
    require(
      msg.sender == timeLock,
      "L1MessageRelayer::onlyTimeLock: Unauthorized message sender"
    );
    _;
  }

  constructor(address _timeLock, address _inbox) {
    require(_timeLock != address(0), "_timeLock can't the zero address");
    require(_inbox != address(0), "_inbox can't the zero address");
    timeLock = _timeLock;
    inbox = IInbox(_inbox);
  }

  /**
   * @dev Initialises the address of the l2MessageExecutorProxy contract.
   * @param _l2MessageExecutorProxy the address of L2 contract used to relay L1 messages.
   **/
  function setL2MessageExecutorProxy(address _l2MessageExecutorProxy) external onlyOwner {
    require(
      l2MessageExecutorProxy == address(0x0),
      "L1MessageRelayer::setL2MessageExecutorProxy: l2MessageExecutorProxy is already set"
    );
    l2MessageExecutorProxy = _l2MessageExecutorProxy;
  }

	/// @notice renounceOwnership has been disabled so that the contract is never left without a onwer
  /// @inheritdoc Ownable
  function renounceOwnership() public override onlyOwner {
    revert("function disabled");
  }

  /**
   * @dev Update the address of the L2MessageExecutorProxy contract.
   * @param _l2MessageExecutorProxy the address of L2 contract used to relay L1 messages.
   **/
  function updateL2MessageExecutorProxy(address _l2MessageExecutorProxy)
    external
    onlyTimeLock
  {
    require(
      _l2MessageExecutorProxy != address(0),
      "L1MessageRelayer::updateL2MessageExecutorProxy _l2MessageExecutorProxy is the zero address"
    );
    l2MessageExecutorProxy = _l2MessageExecutorProxy;
  }

  /**
   * @notice sends message received from timeLock to L2MessageExecutorProxy.
   * @param payLoad message received from L1 that needs to be executed.
   **/
  function relayMessage(
    bytes calldata payLoad,
    uint256 maxSubmissionCost,
    uint256 maxGas,
    uint256 gasPriceBid
  ) external payable onlyTimeLock returns (uint256) {
    require(maxGas != 1, "maxGas can't be 1");
    require(gasPriceBid != 1, "gasPriceBid can't be 1");
    bytes memory data = abi.encodeWithSelector(
      L2MessageExecutor.executeMessage.selector,
      payLoad
    );
    uint256 ticketID = inbox.createRetryableTicket{value: msg.value}(
      l2MessageExecutorProxy,
      0,
      maxSubmissionCost,
      msg.sender,
      msg.sender,
      maxGas,
      gasPriceBid,
      data
    );
    emit RetryableTicketCreated(ticketID);
    return ticketID;
  }
}
