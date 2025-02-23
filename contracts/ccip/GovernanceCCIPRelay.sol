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
  IRouterClient public immutable CCIP_ROUTER;

  /// @inheritdoc IGovernanceCCIPRelay
  address public immutable TIMELOCK;

  /// @inheritdoc IGovernanceCCIPRelay
  mapping(uint64 => address) public destinationReceivers;

  uint64 private constant CCIP_MAINNET_CHAIN_SELECTOR = 5009297550715157269;

  /// @dev Modifier to restrict access to the Timelock contract.
  modifier onlyTimeLock() {
    require(msg.sender == TIMELOCK, Unauthorized(msg.sender));
    _;
  }

  /// @dev Constructor to initialize the GovernanceCCIPRelay contract.
  /// @param _timelock The address of the Timelock contract.
  /// @param _router The address of the CCIP router contract.
  /// @param _destinationChainSelectors Array of chain selectors for the destination chains.
  /// @param _destinationReceivers Array addresses of the receiver contracts on the destination chains.
  constructor(
    address _timelock,
    address _router,
    uint64[] memory _destinationChainSelectors,
    address[] memory _destinationReceivers
  ) {
    require(_timelock != address(0), AddressCannotBeZero());
    require(_router != address(0), AddressCannotBeZero());
    CCIP_ROUTER = IRouterClient(_router);
    TIMELOCK = _timelock;
    _addDestinationChains(_destinationChainSelectors, _destinationReceivers);
  }

  /// @inheritdoc IGovernanceCCIPRelay
  function addDestinationChains(
    uint64[] memory _destinationChainSelectors,
    address[] memory _destinationReceivers
  ) external onlyTimeLock {
    _addDestinationChains(_destinationChainSelectors, _destinationReceivers);
  }

  function _addDestinationChains(
    uint64[] memory _destinationChainSelectors,
    address[] memory _destinationReceivers
  ) private {
    uint256 receiversLength = _destinationReceivers.length;
    require(
      _destinationChainSelectors.length == receiversLength,
      ArrayLengthMismatch()
    );

    for (uint256 i = 0; i < receiversLength; ) {
      uint64 _destinationChainSelector = _destinationChainSelectors[i];
      address _destinationReceiver = _destinationReceivers[i];

      require(
        CCIP_ROUTER.isChainSupported(_destinationChainSelector),
        DestinationChainNotSupported(_destinationChainSelector)
      );

      require(
        _destinationChainSelector != CCIP_MAINNET_CHAIN_SELECTOR,
        CannotUseMainnetChainSelector()
      );

      require(
        _destinationReceiver != address(0),
        ReceiverCannotBeZeroAddress()
      );

      require(
        destinationReceivers[_destinationChainSelector] == address(0),
        ChainSelectorAlreadyAssigned(_destinationChainSelector)
      );

      destinationReceivers[_destinationChainSelector] = _destinationReceiver;
      emit DestinationChainAdded(
        _destinationChainSelector,
        _destinationReceiver
      );

      unchecked {
        i++;
      }
    }
  }

  /// @inheritdoc IGovernanceCCIPRelay
  function updateDestinationReceiver(
    uint64 _destinationChainSelector,
    address _destinationReceiver
  ) external onlyTimeLock {
    address oldDestinationReceiver = destinationReceivers[
      _destinationChainSelector
    ];

    require(
      oldDestinationReceiver != address(0),
      DestinationChainIsNotAdded(_destinationChainSelector)
    );
    require(_destinationReceiver != address(0), ReceiverCannotBeZeroAddress());
    require(
      oldDestinationReceiver != _destinationReceiver,
      ReceiverUnchanged()
    );

    destinationReceivers[_destinationChainSelector] = _destinationReceiver;
    emit DestinationReceiverUpdated(
      _destinationChainSelector,
      oldDestinationReceiver,
      _destinationReceiver
    );
  }

  /// @inheritdoc IGovernanceCCIPRelay
  function relayMessage(
    uint64 destinationChainSelector,
    address target,
    bytes calldata payload
  ) external payable onlyTimeLock returns (bytes32 messageId) {
    require(target != address(0), AddressCannotBeZero());
    require(payload.length != 0, PayloadCannotBeEmpty());

    address destinationReceiver = destinationReceivers[
      destinationChainSelector
    ];
    require(
      destinationReceiver != address(0),
      DestinationChainIsNotAdded(destinationChainSelector)
    );
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
    uint256 fee = CCIP_ROUTER.getFee(destinationChainSelector, message);
    require(msgValue >= fee, InsufficientFee(msg.value, fee));

    // Send the message via CCIP
    messageId = CCIP_ROUTER.ccipSend{value: fee}(
      destinationChainSelector,
      message
    );

    // Refund excess Ether to the sender
    uint256 excess = msg.value - fee;
    if (excess > 0) {
      (bool success, ) = msg.sender.call{value: excess}("");
      require(success, FailedToRefundEth());
    }

    emit MessageRelayed(messageId, target, payload);
  }
}
