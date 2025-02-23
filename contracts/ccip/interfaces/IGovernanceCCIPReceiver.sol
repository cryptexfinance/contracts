// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

/**
 * @title IGovernanceCCIPReceiver
 * @dev Interface for the GovernanceCCIPReceiver contract.
 */
interface IGovernanceCCIPReceiver {
  /// @notice Emitted when a message is successfully executed.
  /// @param messageId The ccip message id.
  /// @param target The target address on the destination chain.
  /// @param payload The payload of the message.
  event MessageExecutedSuccessfully(
    bytes32 indexed messageId,
    address indexed target,
    bytes payload
  );

  /// @notice Emitted when a message is successfully executed.
  /// @param messageId The ccip message id.
  /// @param target The target address on the destination chain.
  /// @param payload The payload of the message.
  /// @param _error The error returned by the message call.
  event MessageExecutionFailed(
    bytes32 indexed messageId,
    address indexed target,
    bytes payload,
    bytes _error
  );

  /// @dev Error thrown when a provided address is the zero address.
  error AddressCannotBeZero();

  /// @dev Error thrown when an unauthorized caller tries to execute a restricted function.
  /// @param caller The address of the unauthorized caller.
  error Unauthorized(address caller);

  /// @dev Error thrown when the target address is zero.
  error TargetAddressCannotBeZero();

  /// @dev Error thrown when the chain selector of the incoming message is invalid.
  error InvalidChainSelector();

  /// @notice Returns the address of the sender contract on Ethereum Mainnet.
  /// @return The address of the mainnet sender.
  function mainnetSender() external view returns (address);

  /// @notice Returns the chain selector for Ethereum Mainnet.
  /// @return The chain selector for Ethereum Mainnet.
  function mainnetChainSelector() external view returns (uint64);
}
