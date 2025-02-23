// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IGovernanceCCIPReceiver} from "./interfaces/IGovernanceCCIPReceiver.sol";
import {Ownable} from "@openzeppelin/contracts-v5/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts-v5/utils/Pausable.sol";

/**
 * @title GovernanceReceiver
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
  address public immutable mainnetSender;

  /// @inheritdoc IGovernanceCCIPReceiver
  uint64 public constant mainnetChainSelector = 5009297550715157269;

  mapping(bytes32 => bool) public processedMessages;

  /// @dev Constructor to initialize the BaseGovernanceReceiver contract.
  /// @param _router The address of the CCIP router contract on the destination chain.
  /// @param _sender The address of the mainnet sender.
  constructor(
    address _router,
    address _sender,
    address _owner
  ) CCIPReceiver(_router) Ownable(_owner) {
    require(_sender != address(0), AddressCannotBeZero());
    mainnetSender = _sender;
  }

  function pause() external onlyOwner {
    _pause();
  }

  /// @notice Handles incoming CCIP messages and executes the payload.
  /// @dev This function processes cross-chain messages from Ethereum Mainnet.
  /// @param message The CCIP message containing the target address and payload.
  function _ccipReceive(Client.Any2EVMMessage memory message)
    internal
    override
    whenNotPaused
  {
    bytes32 messageId = message.messageId;
    // check if message has been processed before
    require(!processedMessages[messageId], MessageAlreadyProcessed(messageId));
    processedMessages[messageId] = true;

    // Validate chain selector
    require(
      message.sourceChainSelector == mainnetChainSelector,
      InvalidChainSelector()
    );

    // Validate sender
    address messageSender = abi.decode(message.sender, (address));
    require(messageSender == mainnetSender, Unauthorized(messageSender));

    // Decode payload
    (address target, bytes memory payload) = abi.decode(
      message.data,
      (address, bytes)
    );

    require(target != address(0), TargetAddressCannotBeZero());

    // Execute payload
    (bool success, bytes memory _error) = target.call(payload);
    if (success) {
      emit MessageExecutedSuccessfully(messageId, target, payload);
    } else {
      emit MessageExecutionFailed(messageId, target, payload, _error);
    }
  }
}
