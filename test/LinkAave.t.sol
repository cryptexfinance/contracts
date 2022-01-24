// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "ds-test/test.sol";
import "../contracts/ERC20VaultHandler.sol";
import "../contracts/mocks/AAVE.sol";

interface Vm {
	// Set block.timestamp (newTimestamp)
	function warp(uint256) external;
	// Set block.height (newHeight)
	function roll(uint256) external;
	// Loads a storage slot from an address (who, slot)
	function load(address, bytes32) external returns (bytes32);
	// Stores a value to an address' storage slot, (who, slot, value)
	function store(address, bytes32, bytes32) external;
	// Signs data, (privateKey, digest) => (r, v, s)
	function sign(uint256, bytes32) external returns (uint8, bytes32, bytes32);
	// Gets address for a given private key, (privateKey) => (address)
	function addr(uint256) external returns (address);
	// Performs a foreign function call via terminal, (stringInputs) => (result)
	//	function ffi(string[] calldata) external returns (bytes memory);
	// Calls another contract with a specified `msg.sender`
	function prank(address) external;
	// Sets an address' balance, (who, newBalance)
	function deal(address, uint256) external;
	// Sets an address' code, (who, newCode)
	function etch(address, bytes calldata) external;
	// Expects an error on next call
	function expectRevert(bytes calldata) external;
}

contract LinkAaveTest is DSTest {
	address AAVEToken = 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9;
	address Link = 0x514910771AF9Ca656af840dff83E8264EcF986CA;
	address aaveHodler = 0x5797F722b1FeE36e3D2c3481D938d1372bCD99A7;
	ERC20VaultHandler aaveVault = ERC20VaultHandler(0xada39d170551daf42822E1D3dA64efEBbD14d1D3);
	ERC20VaultHandler linkVault = ERC20VaultHandler(0xbEB44Febc550f69Ff17f8Aa8eeC070B95eF369ba);
	Vm vm;

	function setUp() public {
		vm = Vm(HEVM_ADDRESS);
	}

	function testDepositCollateral() public {
		emit    log_uint(AAVE(AAVEToken).balanceOf(aaveHodler));
	}

	function testRemoveCollateral() public {
		assert(false);
	}

	function testMintTCAP() public {
		assert(false);
	}

	function testBurnTCAP() public {
		assert(false);
	}
}
