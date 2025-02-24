// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {GovernanceCCIPRelay, IGovernanceCCIPRelay} from "contracts/ccip/GovernanceCCIPRelay.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";

contract GovernanceCCIPRelayTest is Test {
  GovernanceCCIPRelay public relay;
  address public timelock = address(0x1); // Timelock address
  address public ccipRouter = address(0x2); // Mocked Chainlink CCIP Router
  address public destinationReceiver = address(0x3);
  uint64 public destinationChainSelector = 5009297550715157269;
  address public attacker = address(0x4); // Unauthorized user
  address public recipient = address(0x5); // Recipient for withdrawal

  function setUp() public {
    // Deploy the GovernanceCCIPRelay contract
    relay = new GovernanceCCIPRelay(
      timelock,
      ccipRouter,
      destinationChainSelector,
      destinationReceiver
    );
  }

  /// @notice Test constructor arguments are set correctly
  function testConstructorSetsArgumentsCorrectly() public {
    assertEq(relay.TIMELOCK(), timelock, "Timelock address mismatch");
    assertEq(
      address(relay.ccipRouter()),
      ccipRouter,
      "Router address mismatch"
    );
    assertEq(
      relay.destinationChainSelector(),
      destinationChainSelector,
      "Chain selector mismatch"
    );
    assertEq(
      relay.destinationReceiver(),
      destinationReceiver,
      "Destination receiver mismatch"
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
    relay.relayMessage{value: fee}(target, payload);
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
    relay.relayMessage(target, payload);
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
    relay.relayMessage{value: fee + excess}(target, payload);

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
    relay.relayMessage{value: fee}(target, payload);
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
    relay.relayMessage{value: fee - 0.1 ether}(target, payload);
  }

  /// @notice Test withdraw transfers ETH to recipient
  function testWithdrawTransfersETH() public {
    vm.deal(address(relay), 2 ether); // Fund contract

    uint256 recipientBalanceBefore = recipient.balance;
    vm.prank(timelock);
    relay.withdraw(payable(recipient));

    assertEq(
      recipient.balance,
      recipientBalanceBefore + 2 ether,
      "ETH was not transferred correctly"
    );
  }

  /// @notice Test withdraw reverts when transfer fails
  function testWithdrawFailsWhenTransferFails() public {
    // Create a contract that always rejects ETH
    address nonPayable = address(new NonPayable());

    vm.deal(address(relay), 2 ether); // Fund contract

    vm.prank(timelock);
    vm.expectRevert(IGovernanceCCIPRelay.WithdrawFailed.selector);
    relay.withdraw(payable(nonPayable));
  }

  /// @notice Test withdraw raises error when non-timelock calls it
  function testWithdrawUnauthorized() public {
    vm.deal(address(relay), 2 ether); // Fund contract

    vm.prank(attacker);
    vm.expectRevert(
      abi.encodeWithSelector(
        IGovernanceCCIPRelay.Unauthorized.selector,
        attacker
      )
    );
    relay.withdraw(payable(recipient));
  }
}

/// @dev Helper contract that rejects ETH transfers
contract NonPayable {
  receive() external payable {
    revert("Rejecting ETH");
  }
}
