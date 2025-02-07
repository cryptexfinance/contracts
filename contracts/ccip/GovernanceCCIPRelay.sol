// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

/**
 * @title GovernanceRelay
 * @dev A contract for relaying governance proposals from Ethereum Mainnet to Destination Chain using CCIP.
 * This contract allows the Timelock contract to send cross-chain messages to a receiver contract on the destination chain..
 */
contract GovernanceCCIPRelay {
  /// @notice The CCIP router contract used for cross-chain messaging.
  IRouterClient public ccipRouter;

  /// @notice The address of the Timelock contract that can call this contract.
  address public timelock;

  /// @notice The address of the receiver contract on destination.
  address public destinationReceiver;

  /// @notice The chain selector for the destination chain.
  uint64 public destinationChainSelector;

  /// @notice Emitted when a message is relayed to the destination chain.
  /// @param target The target address on the destination chain.
  /// @param payload The payload of the message.
  event MessageRelayed(address target, bytes payload);

  event DestinationReceiverUpdated(address oldReceiver, address newReceiver);

  /// @dev Error thrown when an unauthorized caller tries to execute a restricted function.
  /// @param caller The address of the unauthorized caller.
  error Unauthorized(address caller);

  /// @dev Error thrown when insufficient fee is sent for cross-chain messaging.
  /// @param value The amount of Ether sent.
  /// @param requiredFee The required fee for the CCIP message.
  error InsufficientFee(uint256 value, uint256 requiredFee);

  /// @dev Error thrown when a refund of excess Ether fails.
  error FailedToRefundEth();

  /// @dev Error thrown when withdrawing Ether from the contract fails.
  error WithdrawFailed();

  /// @dev Modifier to restrict access to the Timelock contract.
  modifier onlyTimeLock() {
    if (msg.sender != address(timelock)) revert Unauthorized(msg.sender);
    _;
  }

  /**
   * @dev Constructor to initialize the GovernanceRelay contract.
   * @param _timelock The address of the Timelock contract.
   * @param _router The address of the CCIP router contract.
   * @param _destinationChainSelector The chain selector for the destination chain.
   * @param _receiver The address of the receiver contract on the destination chain.
   */
  constructor(
    address _timelock,
    address _router,
    uint64 _destinationChainSelector,
    address _receiver
  ) {
    ccipRouter = IRouterClient(_router);
    timelock = _timelock;
    destinationChainSelector = _destinationChainSelector;
    destinationReceiver = _receiver;
  }

  /**
   * @notice Sets the address of the receiver contract on the destination chain.
   * @param _receiver The address of the receiver contract on the destination chain.
   * @dev Only the Timelock contract can call this function.
   */
  function setDestinationReceiver(address _receiver) external onlyTimeLock {
    emit DestinationReceiverUpdated(destinationReceiver, _receiver);
    destinationReceiver = _receiver;
  }

  /**
   * @notice Relays a message to the destination chain chain via CCIP.
   * @param target The target address on the destination chain chain.
   * @param payload The payload of the message.
   * @dev Only the Timelock contract can call this function.
   * @dev The caller must send enough Ether to cover the CCIP fee.
   * @dev Excess Ether is refunded to the caller.
   */
  function relayMessage(address target, bytes calldata payload)
    external
    payable
    onlyTimeLock
  {
    // Create the CCIP message
    Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
      receiver: abi.encode(destinationReceiver),
      data: abi.encode(target, payload),
      tokenAmounts: new Client.EVMTokenAmount[](0),
      extraArgs: "",
      feeToken: address(0)
    });

    // Calculate the required fee
    uint256 msgValue = msg.value;
    uint256 fee = ccipRouter.getFee(destinationChainSelector, message);
    if (msgValue < fee) {
      revert InsufficientFee(msg.value, fee);
    }

    // Send the message via CCIP
    ccipRouter.ccipSend{value: fee}(destinationChainSelector, message);

    // Refund excess Ether to the sender
    uint256 excess = msg.value - fee;
    if (excess > 0) {
      (bool success, ) = msg.sender.call{value: excess}("");
      if (!success) {
        revert FailedToRefundEth();
      }
    }

    emit MessageRelayed(target, payload);
  }

  /**
   * @dev Fallback function to allow the contract to receive Ether.
   */
  receive() external payable {}

  /**
   * @notice Withdraws all Ether from the contract to the specified recipient.
   * @param recipient The address to which the Ether will be sent.
   * @dev Only the Timelock contract can call this function.
   */
  function withdraw(address payable recipient) external onlyTimeLock {
    (bool success, ) = recipient.call{value: address(this).balance}("");
    if (!success) {
      revert WithdrawFailed();
    }
  }
}
