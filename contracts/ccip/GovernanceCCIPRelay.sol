// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IGovernanceCCIPRelay} from "./interfaces/IGovernanceCCIPRelay.sol";

/**
 * @title GovernanceCCIPRelay
 * @dev A contract for relaying governance proposals from Ethereum Mainnet to Destination Chain using CCIP.
 * This contract allows the Timelock contract to send cross-chain messages to a receiver contract on the destination chain..
 */
contract GovernanceCCIPRelay is IGovernanceCCIPRelay {
  /// @inheritdoc IGovernanceCCIPRelay
  IRouterClient public immutable ccipRouter;

  /// @inheritdoc IGovernanceCCIPRelay
  address public immutable TIMELOCK;

  /// @inheritdoc IGovernanceCCIPRelay
  address public destinationReceiver;

  /// @inheritdoc IGovernanceCCIPRelay
  uint64 public destinationChainSelector;

  /// @dev Modifier to restrict access to the Timelock contract.
  modifier onlyTimeLock() {
    require(msg.sender == TIMELOCK, Unauthorized(msg.sender));
    _;
  }

  /// @dev Constructor to initialize the GovernanceCCIPRelay contract.
  /// @param _timelock The address of the Timelock contract.
  /// @param _router The address of the CCIP router contract.
  /// @param _destinationChainSelector The chain selector for the destination chain.
  /// @param _receiver The address of the receiver contract on the destination chain.
  constructor(
    address _timelock,
    address _router,
    uint64 _destinationChainSelector,
    address _receiver
  ) {
    ccipRouter = IRouterClient(_router);
    TIMELOCK = _timelock;
    destinationChainSelector = _destinationChainSelector;
    destinationReceiver = _receiver;
  }

  /// @inheritdoc IGovernanceCCIPRelay
  function setDestinationReceiver(address _receiver) external onlyTimeLock {
    emit DestinationReceiverUpdated(destinationReceiver, _receiver);
    destinationReceiver = _receiver;
  }

  /// @inheritdoc IGovernanceCCIPRelay
  function relayMessage(address target, bytes calldata payload)
    external
    payable
    onlyTimeLock
    returns (bytes32 messageId)
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
    require(msgValue >= fee, InsufficientFee(msg.value, fee));

    // Send the message via CCIP
    messageId = ccipRouter.ccipSend{value: fee}(
      destinationChainSelector,
      message
    );

    // Refund excess Ether to the sender
    uint256 excess = msg.value - fee;
    if (excess > 0) {
      (bool success, ) = msg.sender.call{value: excess}("");
      require(success, FailedToRefundEth());
    }

    emit MessageRelayed(target, payload);
  }

  /// @dev Fallback function to allow the contract to receive Ether.
  receive() external payable {}

  /// @inheritdoc IGovernanceCCIPRelay
  function withdraw(address payable recipient) external onlyTimeLock {
    (bool success, ) = recipient.call{value: address(this).balance}("");
    require(success, WithdrawFailed());
  }
}
