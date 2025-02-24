// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";

/**
 * @title IGovernanceCCIPRelay
 * @dev Interface for the GovernanceCCIPRelay contract.
 */
interface IGovernanceCCIPRelay {
  /// @notice Emitted when a governance message is relayed.
  /// @param target The target address of the execution.
  /// @param payload The calldata payload executed.
  event MessageRelayed(address indexed target, bytes payload);

  /// @notice Emitted when a new destination chain is added.
  /// @param chainSelector The CCIP chain selector of the destination chain.
  /// @param receiver The address of the receiver contract on the destination chain.
  event DestinationChainAdded(
    uint64 indexed chainSelector,
    address indexed receiver
  );

  /// @notice Emitted when the destination receiver is updated.
  /// @param chainSelector The CCIP chain selector of the destination chain.
  /// @param oldReceiver The previous destination receiver address.
  /// @param newReceiver The new destination receiver address.
  event DestinationReceiverUpdated(
    uint64 indexed chainSelector,
    address indexed oldReceiver,
    address indexed newReceiver
  );

  /// @dev Error thrown when an unauthorized caller tries to execute a restricted function.
  error Unauthorized(address caller);

  /// @dev Error thrown when the destination receiver address is the zero address.
  error ReceiverCannotBeZeroAddress();

  /// @dev Error thrown when a chain selector is already assigned.
  /// @param chainSelector The chain selector that is already assigned.
  error ChainSelectorAlreadyAssigned(uint64 chainSelector);

  /// @dev Error thrown when the provided chain selector is not supported by ccip.
  /// @param chainSelector The chain selector that is not supported.
  error DestinationChainNotSupported(uint64 chainSelector);

  /// @dev Thrown when attempting to use the Ethereum Mainnet chain selector as a destination.
  /// This ensures that governance proposals are not relayed back to the originating chain.
  error CannotUseMainnetChainSelector();

  /// @dev Error thrown when the provided chain selector is not supported by ccip.
  /// @param chainSelector The chain selector that is not supported.
  error DestinationChainIsNotAdded(uint64 chainSelector);

  /// @dev Error thrown when the lengths of input arrays do not match.
  error ArrayLengthMismatch();

  /// @dev Error thrown when there are insufficient funds to cover the CCIP fee.
  error InsufficientFee(uint256 value, uint256 requiredFee);

  /// @dev Error thrown when ETH refund to sender fails.
  error FailedToRefundEth();

  /// @dev Error thrown when attempting to set the destination receiver to the same address as the current one.
  error ReceiverUnchanged();

  /// @notice Returns the address of the CCIP router contract.
  /// @return The address of the CCIP router.
  function ccipRouter() external view returns (IRouterClient);

  /// @notice Returns the address of the timelock contract.
  /// @return The address of the timelock.
  function timelock() external view returns (address);

  /// @notice Returns the address of the destination receiver.
  /// @param _chainSelector the ccip id of the the destination chain.
  /// @return The address of the destination receiver.
  function destinationReceivers(uint64 _chainSelector)
    external
    view
    returns (address);

  /// @notice Sets the address of the receiver contracts for the destination chains.
  /// @param _destinationChainSelectors Array of chain selectors for the destination chains.
  /// @param _destinationReceivers Array addresses of the receiver contracts on the destination chains.
  /// @dev Only the Timelock contract can call this function.
  function addDestinationChains(
    uint64[] memory _destinationChainSelectors,
    address[] memory _destinationReceivers
  ) external;

  /// @notice Updates the destination receiver for a specific chain selector, if it has been previously added.
  /// @param _destinationChainSelector The chain selector for which the receiver is being updated.
  /// @param _destinationReceiver The new address of the destination receiver.
  function updateDestinationReceiver(
    uint64 _destinationChainSelector,
    address _destinationReceiver
  ) external;

  /// @notice Relays a governance message to the destination chain.
  /// @param destinationChainSelector The ccip chain selector of the destination chain for the message.
  /// @param target The target address to execute the message on.
  /// @param payload The calldata payload to execute.
  /// @return messageId The unique identifier of the sent message.
  function relayMessage(
    uint64 destinationChainSelector,
    address target,
    bytes calldata payload
  ) external payable returns (bytes32 messageId);
}
