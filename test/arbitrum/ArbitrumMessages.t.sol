// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../../contracts/arbitrum/L1MessageRelayer.sol";
import "../../contracts/arbitrum/L2MessageExecutor.sol";
import "../../contracts/arbitrum/AddressAliasHelper.sol";
import "../../contracts/mocks/Greeter.sol";
import "./mocks/MockInbox.sol";

contract ArbitrumMessages is Test {
  address user = address(0x1);

  L1MessageRelayer l1MessageRelayer;
  L2MessageExecutor l2MessageExecutor;
  Greeter greeter;
  MockInbox inbox;

  function setUp() public {
    vm.startPrank(address(user));
    inbox = new MockInbox();
    l1MessageRelayer = new L1MessageRelayer(user, address(inbox));
    l2MessageExecutor = new L2MessageExecutor();
		l2MessageExecutor.initialize(address(l1MessageRelayer));
    greeter = new Greeter("First Message");
    l1MessageRelayer.setL2MessageExecutorProxy(address(l2MessageExecutor));
    vm.stopPrank();
  }


  function testExecuteMessage() public {
    bytes memory callData = abi.encodeWithSelector(
      Greeter.setGreeting.selector,
      "Second Message"
    );
    bytes memory payLoad = abi.encode(address(greeter), callData);
    vm.startPrank(AddressAliasHelper.applyL1ToL2Alias(address(l1MessageRelayer)));
    assertEq(greeter.greet(), "First Message");
    l2MessageExecutor.executeMessage(payLoad);
    assertEq(greeter.greet(), "Second Message");
  }

  function testExecuteMessageWithInbox() public {
    assertEq(greeter.greet(), "First Message");

    bytes memory _callData = abi.encodeWithSelector(
      Greeter.setGreeting.selector,
      "Second Message"
    );
    bytes memory _payLoad = abi.encode(address(greeter), _callData);
    vm.startPrank(user);
    l1MessageRelayer.relayMessage(_payLoad, 21000 * 5, 21000 * 5, 21000 * 5);
    assertEq(greeter.greet(), "Second Message");
  }

  function testRevertOnUnAuthorizedTimelock() public {
    bytes memory callData = abi.encodeWithSelector(
      Greeter.setGreeting.selector,
      "Second Message"
    );
    bytes memory payLoad = abi.encode(address(greeter), callData);
    vm.expectRevert(
      "L1MessageRelayer::onlyTimeLock: Unauthorized message sender"
    );
    l1MessageRelayer.relayMessage(payLoad, 21000 * 5, 21000 * 5, 21000 * 5);
  }

  function testRevertOnUpdateExecutor() public {
    vm.expectRevert("L1MessageRelayer::onlyTimeLock: Unauthorized message sender");
    l1MessageRelayer.updateL2MessageExecutorProxy(address(l2MessageExecutor));
  }

  function testUpdateL2MessageExecutor() public {
    vm.startPrank(user);
    assertEq(l1MessageRelayer.l2MessageExecutorProxy(), address(l2MessageExecutor));
    l1MessageRelayer.updateL2MessageExecutorProxy(user);
    assertEq(l1MessageRelayer.l2MessageExecutorProxy(), user);
    vm.stopPrank();
  }
}
