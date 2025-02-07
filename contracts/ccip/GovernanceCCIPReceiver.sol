// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Test, console} from "forge-std/Test.sol";

/**
 * @title GovernanceReceiver
 * @dev A contract for receiving and executing governance proposals from Ethereum Mainnet via CCIP.
 * This contract processes cross-chain messages and executes them on the destination chain.
 */
contract GovernanceCCIPReceiver is CCIPReceiver {
  /// @notice The address of the sender contract on Ethereum Mainnet.
  address public mainnetSender;

  /// @notice The chain selector for Ethereum Mainnet.
  uint64 public mainnetChainSelector;

  /// @notice Emitted when a message is successfully executed.
  /// @param target The target address on the destination chain.
  /// @param payload The payload of the message.
  event MessageExecuted(address target, bytes payload);
  /// @notice Emitted when the mainnet sender address is updated.
  /// @param oldSender The previous sender address.
  /// @param newSender The new sender address.
  event MainnetSenderUpdated(address oldSender, address newSender);

  /// @dev Error thrown when an unauthorized caller tries to execute a restricted function.
  /// @param caller The address of the unauthorized caller.
  error Unauthorized(address caller);
  /// @dev Error thrown when the execution of a message fails.
  error MessageCallFailed();
  /// @dev Error thrown when the target address is zero.
  error TargetAddressCannotBeZero();
  /// @dev Error thrown when the chain selector of the incoming message is invalid.
  error InvalidChainSelector();
  /// @dev Error thrown when the payload of the incoming message is invalid.
  error InvalidPayload();

  /**
   * @dev Constructor to initialize the BaseGovernanceReceiver contract.
   * @param _mainnetChainSelector The chain selector for Ethereum Mainnet.
   */
  constructor(
    address _router,
    uint64 _mainnetChainSelector,
    address _sender
  ) CCIPReceiver(_router) {
    mainnetChainSelector = _mainnetChainSelector;
    mainnetSender = _sender;
  }

  /**
   * @notice Internal function to handle incoming CCIP messages.
   * @param message The CCIP message containing the target address and payload.
   * @dev This function is called by the CCIP router when a message is received.
   * @dev Reverts if the chain selector, sender, or payload is invalid.
   * @dev Reverts if the target address is zero or the message execution fails.
   */
  function _ccipReceive(Client.Any2EVMMessage memory message)
    internal
    override
  {
    // Validate chain selector
    if (message.sourceChainSelector != mainnetChainSelector)
      revert InvalidChainSelector();
    // Validate sender
    address messageSender = abi.decode(message.sender, (address));
    if (messageSender != mainnetSender) revert Unauthorized(messageSender);

    // Validate payload length
    if (message.data.length < 64) revert InvalidPayload();
    // Decode payload
    (address target, bytes memory payload) = abi.decode(
      message.data,
      (address, bytes)
    );

    if (target == address(0)) revert TargetAddressCannotBeZero();

    // Execute payload
    (bool success, ) = target.call(payload);
    if (!success) revert MessageCallFailed();

    emit MessageExecuted(target, payload);
  }
}
