// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

/**
 * @title IGovernanceCCIPReceiver
 * @dev Interface for the GovernanceCCIPReceiver contract.
 */
interface IGovernanceCCIPReceiver {
  /// @notice Emitted when a message is successfully executed.
  /// @param target The target address on the destination chain.
  /// @param payload The payload of the message.
  event MessageExecuted(address indexed target, bytes payload);

  /// @dev Error thrown when an unauthorized caller tries to execute a restricted function.
  /// @param caller The address of the unauthorized caller.
  error Unauthorized(address caller);

  /// @dev Error thrown when the execution of a message fails.
  error MessageCallFailed();

  /// @dev Error thrown when the target address is zero.
  error TargetAddressCannotBeZero();

  /// @dev Error thrown when the chain selector of the incoming message is invalid.
  error InvalidChainSelector();

  /// @notice Returns the address of the sender contract on Ethereum Mainnet.
  /// @return The address of the mainnet sender.
  function MAINNET_SENDER() external view returns (address);

  /// @notice Returns the chain selector for Ethereum Mainnet.
  /// @return The chain selector for Ethereum Mainnet.
  function MAINNET_CHAIN_SELECTOR() external view returns (uint64);
}
