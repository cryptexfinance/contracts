// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "@arbitrum/nitro-contracts/src/bridge/IInbox.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./L2MessageExecutor.sol";

contract L1MessageRelayer is Ownable {
  /// @notice Address of the governance TimeLock contract.
  address public timeLock;

  /// @notice Address of the L2MessageExecutor contract on arbitrum.
  address public l2MessageExecutor;

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

  constructor(
    address _timeLock,
    address _l2MessageExecutor,
    address _inbox
  ) {
    timeLock = _timeLock;
    l2MessageExecutor = _l2MessageExecutor;
    inbox = IInbox(_inbox);
  }

  /**
   * @dev Update the address of the L2MessageExecutor contract.
   * @param _l2MessageExecutor the address of L2 contract used to relay L1 messages.
   **/
  function updateL2MessageExecutor(address _l2MessageExecutor)
    external
    onlyOwner
  {
    require(
      _l2MessageExecutor != address(0),
      "L1MessageRelayer::updateL2MessageExecutor _l2MessageExecutor is the zero address"
    );
    l2MessageExecutor = _l2MessageExecutor;
  }

  /**
   * @notice sends message received from timeLock to L2MessageExecutor.
   * @param payLoad message received from L1 that needs to be executed.
   **/
  function relayMessage(
    bytes calldata payLoad,
    uint256 maxSubmissionCost,
    uint256 maxGas,
    uint256 gasPriceBid
  ) external payable onlyTimeLock returns (uint256) {
    bytes memory data = abi.encodeWithSelector(
      L2MessageExecutor.executeMessage.selector,
      payLoad
    );
    uint256 ticketID = inbox.createRetryableTicket{value: msg.value}(
      l2MessageExecutor,
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
