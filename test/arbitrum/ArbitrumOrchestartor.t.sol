// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../../contracts/arbitrum/L2MessageExecutor.sol";
import "../../contracts/arbitrum/ArbitrumOrchestrator.sol";
import "../../contracts/arbitrum/AddressAliasHelper.sol";


contract ArbitrumOrchestratorTest is Test {
  address user = address(0x1);
	address user2 = address(0x2);

  L2MessageExecutor l2MessageExecutor;
	ArbitrumOrchestrator orchestrator;

  function setUp() public {
    vm.startPrank(address(user));
    l2MessageExecutor = new L2MessageExecutor(user);
    orchestrator = new ArbitrumOrchestrator(user, address(l2MessageExecutor));
    vm.stopPrank();
  }

  function testUpdateOwner() public {
    assertEq(orchestrator.owner(), address(l2MessageExecutor));
		vm.startPrank(AddressAliasHelper.applyL1ToL2Alias(address(user)));
		L2MessageExecutor newL2MessageExecutor = new L2MessageExecutor(user);
		bytes memory callData = abi.encodeWithSelector(
      orchestrator.transferOwnership.selector,
      address(newL2MessageExecutor)
    );
    bytes memory payLoad = abi.encode(address(orchestrator), callData);
		l2MessageExecutor.executeMessage(payLoad);
		assertEq(orchestrator.owner(), address(newL2MessageExecutor));
		vm.stopPrank();
  }

	function testNewOwnerCanMakeCalls() public {
		vm.startPrank(AddressAliasHelper.applyL1ToL2Alias(address(user)));

		// Update owner
		L2MessageExecutor newL2MessageExecutor = new L2MessageExecutor(user);
		bytes memory callData = abi.encodeWithSelector(
      orchestrator.transferOwnership.selector,
      address(newL2MessageExecutor)
    );
    bytes memory payLoad = abi.encode(address(orchestrator), callData);
		l2MessageExecutor.executeMessage(payLoad);
		assertEq(orchestrator.owner(), address(newL2MessageExecutor));

		// Make calls to orchestrator wurg bew owner
		callData = abi.encodeWithSelector(
      orchestrator.setGuardian.selector,
      user2
    );
    payLoad = abi.encode(address(orchestrator), callData);
		assertEq(orchestrator.guardian(), user);
		newL2MessageExecutor.executeMessage(payLoad);
		assertEq(orchestrator.guardian(), user2);

		vm.stopPrank();
	}

	function testRenounceOwnershipShouldRevert() public {
		vm.startPrank(AddressAliasHelper.applyL1ToL2Alias(address(user)));

		L2MessageExecutor newL2MessageExecutor = new L2MessageExecutor(user);
		bytes memory callData = abi.encodeWithSelector(
      orchestrator.renounceOwnership.selector
    );
    bytes memory payLoad = abi.encode(address(orchestrator), callData);
		vm.expectRevert(
      "L2MessageExecutor::executeMessage: Message execution reverted."
    );
		l2MessageExecutor.executeMessage(payLoad);
		vm.stopPrank();
	}

}
