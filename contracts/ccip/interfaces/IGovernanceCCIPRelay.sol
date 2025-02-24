// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";

/**
 * @title IGovernanceCCIPRelay
 * @dev Interface for the GovernanceCCIPRelay contract.
 */
interface IGovernanceCCIPRelay {
  /// @notice Emitted when the destination receiver is updated.
  /// @param oldReceiver The previous destination receiver address.
  /// @param newReceiver The new destination receiver address.
  event DestinationReceiverUpdated(
    address indexed oldReceiver,
    address indexed newReceiver
  );

  /// @notice Emitted when a governance message is relayed.
  /// @param target The target address of the execution.
  /// @param payload The calldata payload executed.
  event MessageRelayed(address indexed target, bytes payload);

  /// @dev Error thrown when an unauthorized caller tries to execute a restricted function.
  error Unauthorized(address caller);

  /// @dev Error thrown when there are insufficient funds to cover the CCIP fee.
  error InsufficientFee(uint256 value, uint256 requiredFee);

  /// @dev Error thrown when ETH refund to sender fails.
  error FailedToRefundEth();

  /// @dev Error thrown when ETH withdrawal fails.
  error WithdrawFailed();

  /// @notice Returns the address of the CCIP router contract.
  /// @return The address of the CCIP router.
  function ccipRouter() external view returns (IRouterClient);

  /// @notice Returns the address of the timelock contract.
  /// @return The address of the timelock.
  function TIMELOCK() external view returns (address);

  /// @notice Returns the address of the destination receiver contract.
  /// @return The address of the destination receiver.
  function destinationReceiver() external view returns (address);

  /// @notice The chain selector for the destination chain.
  /// @return The address of the destination chain selector.
  function destinationChainSelector() external view returns (uint64);

  /// @notice Sets the address of the receiver contract on the destination chain.
  /// @param _receiver The address of the receiver contract on the destination chain.
  /// @dev Only the Timelock contract can call this function.
  function setDestinationReceiver(address _receiver) external;

  /// @notice Relays a governance message to the destination chain.
  /// @param target The target address to execute the message on.
  /// @param payload The calldata payload to execute.
  /// @return messageId The unique identifier of the sent message.
  function relayMessage(address target, bytes calldata payload)
    external
    payable
    returns (bytes32 messageId);

  /// @notice Withdraws all ETH from the contract to the specified recipient.
  /// @param recipient The address to send the withdrawn ETH to.
  function withdraw(address payable recipient) external;
}
