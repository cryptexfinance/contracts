// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {GovernanceCCIPRelay, IGovernanceCCIPRelay} from "contracts/ccip/GovernanceCCIPRelay.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

contract MockCCIPRouter {
  uint64[] supportedChains = [
    5009297550715157269,
    4051577828743386545,
    1111111111111111111,
    9999999999999999999
  ];

  function isChainSupported(uint64 destChainSelector)
    external
    view
    returns (bool)
  {
    for (uint256 i = 0; i < supportedChains.length; i++) {
      if (supportedChains[i] == destChainSelector) {
        return true;
      }
    }
    return false;
  }

  function ccipSend(
    uint64, /*destinationChainSelector*/
    Client.EVM2AnyMessage calldata /*message*/
  ) external payable returns (bytes32) {
    return bytes32("");
  }
}

contract GovernanceCCIPRelayTest is Test {
  GovernanceCCIPRelay public relay;
  address public timelock = address(0x1); // Timelock address
  address public ccipRouter;
  address public destinationReceiver = address(0x3);
  uint64 public destinationChainSelector = 4051577828743386545;
  address public attacker = address(0x4); // Unauthorized user
  address public recipient = address(0x5); // Recipient for withdrawal

  function setUp() public {
    // Deploy the GovernanceCCIPRelay contract
    uint64[] memory chainSelectors = new uint64[](1);
    chainSelectors[0] = destinationChainSelector;
    address[] memory receivers = new address[](1);
    receivers[0] = destinationReceiver;
    ccipRouter = address(new MockCCIPRouter());
    relay = new GovernanceCCIPRelay(
      timelock,
      ccipRouter,
      chainSelectors,
      receivers
    );
  }

  /// @notice Test constructor arguments are set correctly
  function testConstructorSetsArgumentsCorrectly() public {
    assertEq(relay.TIMELOCK(), timelock, "Timelock address mismatch");
    assertEq(
      address(relay.CCIP_ROUTER()),
      ccipRouter,
      "Router address mismatch"
    );
    assertEq(
      relay.destinationReceivers(destinationChainSelector),
      destinationReceiver,
      "destinationReceivers mismatch"
    );
  }

  /// @notice Test setDestinationReceiver can update destinationReceiver
  function testSetDestinationReceiver() public {
    vm.prank(timelock);
    relay.setDestinationReceiver(address(0x6));
    assertEq(
      relay.destinationReceiver(),
      address(0x6),
      "Destination receiver was not updated"
    );
  }

  /// @notice Test setDestinationReceiver reverts when called by non-timelock
  function testSetDestinationReceiverUnauthorized() public {
    vm.prank(attacker);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPRelay.Unauthorized.selector,
        attacker
      )
    );
    relay.setDestinationReceiver(address(0x6));
  }

  /// @notice Test setDestinationReceiver emits DestinationReceiverUpdated event
  function testSetDestinationReceiverEmitsEvent() public {
    vm.prank(timelock);
    vm.expectEmit(true, true, true, true);
    emit IGovernanceCCIPRelay.DestinationReceiverUpdated(
      destinationReceiver,
      address(0x6)
    );
    relay.setDestinationReceiver(address(0x6));
  }

  /// @notice Test relayMessage for successful execution
  function testRelayMessage() public {
    address target = address(0x7);
    bytes memory payload = abi.encodeWithSignature("doSomething()");

    uint256 fee = 1 ether;
    vm.mockCall(
      ccipRouter,
      abi.encodeWithSelector(IRouterClient.getFee.selector),
      abi.encode(fee)
    );

    vm.deal(address(timelock), fee); // Fund this contract
    vm.prank(timelock);
    relay.relayMessage{value: fee}(destinationChainSelector, target, payload);
  }

  /// @notice Test relayMessage reverts when called by non-timelock
  function testRelayMessageUnauthorized() public {
    address target = address(0x7);
    bytes memory payload = abi.encodeWithSignature("doSomething()");

    vm.prank(attacker);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPRelay.Unauthorized.selector,
        attacker
      )
    );
    relay.relayMessage(destinationChainSelector, target, payload);
  }

  /// @notice Test relayMessage returns excess ether
  function testRelayMessageRefundsExcessValue() public {
    address target = address(0x7);
    bytes memory payload = abi.encodeWithSignature("doSomething()");

    uint256 fee = 1 ether;
    uint256 excess = 0.5 ether;
    vm.mockCall(
      ccipRouter,
      abi.encodeWithSelector(IRouterClient.getFee.selector),
      abi.encode(fee)
    );

    vm.deal(address(timelock), fee + excess); // Fund with extra ether
    uint256 balanceBefore = address(timelock).balance;
    vm.prank(timelock);
    relay.relayMessage{value: fee + excess}(
      destinationChainSelector,
      target,
      payload
    );

    uint256 balanceAfter = address(timelock).balance;
    assertEq(
      balanceAfter,
      balanceBefore - fee,
      "Excess ether was not refunded correctly"
    );
  }

  /// @notice Test relayMessage emits MessageRelayed event
  function testRelayMessageEmitsMessageRelayed() public {
    address target = address(0x7);
    bytes memory payload = abi.encodeWithSignature("doSomething()");

    uint256 fee = 1 ether;
    vm.mockCall(
      ccipRouter,
      abi.encodeWithSelector(IRouterClient.getFee.selector),
      abi.encode(fee)
    );

    vm.deal(address(timelock), fee); // Fund this contract

    vm.prank(timelock);
    vm.expectEmit(true, true, true, true);
    emit IGovernanceCCIPRelay.MessageRelayed(target, payload);
    relay.relayMessage{value: fee}(destinationChainSelector, target, payload);
  }

  /// @notice Test relayMessage raises InsufficientFee error when value is less than fee
  function testRelayMessageInsufficientFee() public {
    address target = address(0x7);
    bytes memory payload = abi.encodeWithSignature("doSomething()");

    uint256 fee = 1 ether;
    vm.mockCall(
      ccipRouter,
      abi.encodeWithSelector(IRouterClient.getFee.selector),
      abi.encode(fee)
    );

    vm.deal(address(timelock), fee - 0.1 ether); // Fund with insufficient ether

    vm.prank(timelock);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPRelay.InsufficientFee.selector,
        fee - 0.1 ether,
        fee
      )
    );
    relay.relayMessage{value: fee - 0.1 ether}(
      destinationChainSelector,
      target,
      payload
    );
  }

  function testRelayMessageDestinationChainIsNotAdded() public {
    address target = address(0x7);
    bytes memory payload = abi.encodeWithSignature("doSomething()");

    uint64 unsupportedChainSelector = 9999999999999999999; // Chain not added to the relay

    uint256 fee = 1 ether;
    vm.mockCall(
      ccipRouter,
      abi.encodeWithSelector(IRouterClient.getFee.selector),
      abi.encode(fee)
    );

    vm.deal(address(timelock), fee); // Fund this contract

    vm.prank(timelock);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPRelay.DestinationChainIsNotAdded.selector,
        unsupportedChainSelector
      )
    );
    relay.relayMessage{value: fee}(unsupportedChainSelector, target, payload);
  }

  function testAddDestinationChainsByTimelock() public {
    uint64[] memory newChainSelectors = new uint64[](2);
    newChainSelectors[0] = 9999999999999999999;
    newChainSelectors[1] = 1111111111111111111;

    address[] memory newReceivers = new address[](2);
    newReceivers[0] = address(0x8);
    newReceivers[1] = address(0x9);

    vm.prank(timelock);
    relay.addDestinationChains(newChainSelectors, newReceivers);

    assertEq(
      relay.destinationReceivers(9999999999999999999),
      address(0x8),
      "Receiver mismatch for chain 12345"
    );
    assertEq(
      relay.destinationReceivers(1111111111111111111),
      address(0x9),
      "Receiver mismatch for chain 67890"
    );
  }

  function testAddDestinationChainsUnauthorized() public {
    uint64[] memory newChainSelectors = new uint64[](1);
    newChainSelectors[0] = 9999999999999999999;

    address[] memory newReceivers = new address[](1);
    newReceivers[0] = address(0x8);

    vm.prank(attacker);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPRelay.Unauthorized.selector,
        attacker
      )
    );
    relay.addDestinationChains(newChainSelectors, newReceivers);
  }

  function testAddDestinationChainsRejectsZeroAddressReceiver() public {
    uint64[] memory newChainSelectors = new uint64[](1);
    newChainSelectors[0] = 9999999999999999999;

    address[] memory newReceivers = new address[](1);
    newReceivers[0] = address(0); // Invalid receiver

    vm.prank(timelock);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPRelay.ReceiverCannotBeZeroAddress.selector
      )
    );
    relay.addDestinationChains(newChainSelectors, newReceivers);
  }

  function testAddExistingDestinationChain() public {
    uint64[] memory existingChain = new uint64[](1);
    existingChain[0] = destinationChainSelector;

    address[] memory receivers = new address[](1);
    receivers[0] = destinationReceiver;

    vm.prank(timelock);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPRelay.ChainSelectorAlreadyAssigned.selector,
        destinationChainSelector
      )
    );
    relay.addDestinationChains(existingChain, receivers);
  }

  function testAddDestinationChainsArrayLengthMismatch() public {
    uint64[] memory newChainSelectors = new uint64[](2);
    newChainSelectors[0] = 9999999999999999999;
    newChainSelectors[1] = 1111111111111111111;

    address[] memory newReceivers = new address[](1);
    newReceivers[0] = address(0x14);

    vm.prank(timelock);
    vm.expectRevert(
      abi.encodeWithSelector(IGovernanceCCIPRelay.ArrayLengthMismatch.selector)
    );
    relay.addDestinationChains(newChainSelectors, newReceivers);
  }

  function testAddDestinationChainsEmitsEvent() public {
    uint64[] memory newChainSelectors = new uint64[](1);
    newChainSelectors[0] = 9999999999999999999;

    address[] memory newReceivers = new address[](1);
    newReceivers[0] = address(0x15);

    vm.prank(timelock);
    vm.expectEmit(true, true, true, true);
    emit IGovernanceCCIPRelay.DestinationChainAdded(
      9999999999999999999,
      address(0x15)
    );

    relay.addDestinationChains(newChainSelectors, newReceivers);
  }

  function test_AddDestinationChain_RevertsWhenChainNotSupported() public {
    uint64[] memory newChainSelectors = new uint64[](1);
    newChainSelectors[0] = 2222;

    address[] memory newReceivers = new address[](1);
    newReceivers[0] = address(0x15);

    vm.prank(timelock);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPRelay.DestinationChainNotSupported.selector,
        newChainSelectors[0]
      )
    );
    relay.addDestinationChains(newChainSelectors, newReceivers);
  }

  function test_AddDestinationChain_RevertsWhenUsingMainnetSelector() public {
    uint64[] memory newChainSelectors = new uint64[](1);
    newChainSelectors[0] = 5009297550715157269;

    address[] memory newReceivers = new address[](1);
    newReceivers[0] = address(0x15);

    vm.prank(timelock);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPRelay.CannotUseMainnetChainSelector.selector
      )
    );
    relay.addDestinationChains(newChainSelectors, newReceivers);
  }
}
