// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IGovernanceCCIPReceiver} from "./interfaces/IGovernanceCCIPReceiver.sol";
import {Ownable} from "@openzeppelin/contracts-v5/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts-v5/utils/Pausable.sol";

/**
 * @title GovernanceCCIPReceiver
 * @dev A contract for receiving and executing governance proposals from Ethereum Mainnet via CCIP.
 * This contract processes cross-chain messages and executes them on the destination chain.
 */
contract GovernanceCCIPReceiver is
  IGovernanceCCIPReceiver,
  CCIPReceiver,
  Ownable,
  Pausable
{
  /// @inheritdoc IGovernanceCCIPReceiver
  address public immutable MAINNET_SENDER;

  /// @inheritdoc IGovernanceCCIPReceiver
  uint64 public constant MAINNET_CHAIN_SELECTOR = 5009297550715157269;
  mapping(bytes32 => bool) public processedMessages;

  /// @dev Constructor to initialize the GovernanceCCIPReceiver contract.
  /// @param _router The address of the CCIP router contract on the destination chain.
  /// @param _sender The address of the mainnet sender.
  constructor(
    address _router,
    address _sender,
    address _owner
  ) CCIPReceiver(_router) Ownable(_owner) {
    require(_sender != address(0), AddressCannotBeZero());
    MAINNET_SENDER = _sender;
  }

  /// @inheritdoc IGovernanceCCIPReceiver
  function pause() external onlyOwner {
    _pause();
  }

  /// @inheritdoc IGovernanceCCIPReceiver
  function unpause() external onlyOwner {
    _unpause();
  }

  /// @notice Handles incoming CCIP messages and executes the payload.
  /// @dev This function processes cross-chain messages from Ethereum Mainnet.
  /// @param message The CCIP message containing the target address and payload.
  function _ccipReceive(Client.Any2EVMMessage memory message)
    internal
    override
  {
    bytes32 messageId = message.messageId;
    // check if message has been processed before
    require(!processedMessages[messageId], MessageAlreadyProcessed(messageId));
    processedMessages[messageId] = true;

    if (paused()) {
      emit MessageIgnoredWhilePaused(messageId);
      return;
    }

    // Validate chain selector
    require(
      message.sourceChainSelector == MAINNET_CHAIN_SELECTOR,
      InvalidChainSelector()
    );

    // Validate sender
    address messageSender = abi.decode(message.sender, (address));
    require(messageSender == MAINNET_SENDER, Unauthorized(messageSender));

    // Decode payload
    (address target, bytes memory payload) = abi.decode(
      message.data,
      (address, bytes)
    );

    require(target != address(0), TargetAddressCannotBeZero());

    // Execute payload
    (bool success, bytes memory failure) = target.call(payload);
    if (success) {
      emit MessageExecutedSuccessfully(messageId, target, payload);
    } else {
      emit MessageExecutionFailed(messageId, target, payload, failure);
    }
  }
}
