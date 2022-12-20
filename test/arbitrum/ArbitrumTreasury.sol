// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../../contracts/arbitrum/L2MessageExecutor.sol";
import "../../contracts/arbitrum/ArbitrumTreasury.sol";
import "../../contracts/arbitrum/AddressAliasHelper.sol";


contract ArbitrumTreasuryTest is Test {
  address user = address(0x1);

  L2MessageExecutor l2MessageExecutor;
	ArbitrumTreasury treasury;

  function setUp() public {
    vm.startPrank(address(user));
    l2MessageExecutor = new L2MessageExecutor(user);
    treasury = new ArbitrumTreasury(address(l2MessageExecutor));
    vm.stopPrank();
  }

  function testUpdateOwner() public {
    assertEq(treasury.owner(), address(l2MessageExecutor));
		vm.startPrank(AddressAliasHelper.applyL1ToL2Alias(address(user)));
		L2MessageExecutor newL2MessageExecutor = new L2MessageExecutor(user);
		bytes memory callData = abi.encodeWithSelector(
      treasury.transferOwnership.selector,
      address(newL2MessageExecutor)
    );
    bytes memory payLoad = abi.encode(address(treasury), callData);
		l2MessageExecutor.executeMessage(payLoad);
		assertEq(treasury.owner(), address(newL2MessageExecutor));
		vm.stopPrank();
  }

	function testRenounceOwnershipShouldRevert() public {
		vm.startPrank(AddressAliasHelper.applyL1ToL2Alias(address(user)));

		L2MessageExecutor newL2MessageExecutor = new L2MessageExecutor(user);
		bytes memory callData = abi.encodeWithSelector(
      treasury.renounceOwnership.selector
    );
    bytes memory payLoad = abi.encode(address(treasury), callData);
		vm.expectRevert(
      "L2MessageExecutor::executeMessage: Message execution reverted."
    );
		l2MessageExecutor.executeMessage(payLoad);
		vm.stopPrank();
	}

}
