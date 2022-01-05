// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "ds-test/test.sol";
import "../contracts/optimism/OptimisticTreasury.sol";
import "../contracts/mocks/DAI.sol";

contract OVMl2CrossDomainMessenger {
	address public immutable xDomainMessageSender;

	constructor(address xd){
		xDomainMessageSender = xd;
	}

	function renounceOwnership(OptimisticTreasury ot) public {
		ot.renounceOwnership();
	}

	function transferOwnership(OptimisticTreasury ot, address owner) public {
		ot.transferOwnership(owner);
	}

	function retrieveEth(OptimisticTreasury ot, address to) public {
		ot.retrieveETH(to);
	}

	function executeTransaction(OptimisticTreasury ot, address target, uint256 value, string memory signature, bytes memory data) public {
		ot.executeTransaction(target, value, signature, data);
	}
}

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

contract OptimisticTreasuryTest is DSTest {
	OptimisticTreasury oTreasury;
	Vm vm;
	OVMl2CrossDomainMessenger ol2;


	function setUp() public {
		ol2 = new OVMl2CrossDomainMessenger(address(this));
		oTreasury = new OptimisticTreasury(address(this), address(ol2));
		vm = Vm(HEVM_ADDRESS);
	}

	function testSetParams() public {
		assertEq(address(oTreasury.ovmL2CrossDomainMessenger()), address(ol2));
		assertEq(oTreasury.owner(), address(this));
	}

	function testRenounceOwnership() public {
		vm.expectRevert("OptimisticTreasury: caller is not the owner");
		oTreasury.renounceOwnership();
		ol2.renounceOwnership(oTreasury);
		assertEq(oTreasury.owner(), address(0));
	}

	function testTransferOwnership(address _newOwner) public {
		vm.expectRevert("OptimisticTreasury: caller is not the owner");
		oTreasury.transferOwnership(_newOwner);

		if (_newOwner == address(0)) {
			vm.expectRevert("OptimisticTreasury: new owner is the zero address");
			ol2.transferOwnership(oTreasury, _newOwner);
		} else {
			ol2.transferOwnership(oTreasury, _newOwner);
			assertEq(oTreasury.owner(), _newOwner);
		}
	}

	function testRetrieveEth(address _to) public {
		vm.deal(address(oTreasury), 1 ether);
		assertEq(address(oTreasury).balance, 1 ether);
		vm.expectRevert("OptimisticTreasury: caller is not the owner");
		oTreasury.retrieveETH(_to);
		if (_to == address(0)) {
			vm.expectRevert("ITreasury::retrieveETH: address can't be zero");
			ol2.retrieveEth(oTreasury, _to);
		} else {
			ol2.retrieveEth(oTreasury, _to);
			assertEq(_to.balance, 1 ether);
		}
	}

	function testExecuteTransaction() public {
		DAI dai = new DAI();
		dai.mint(address(oTreasury), 100 ether);
		assertEq(dai.balanceOf(address(oTreasury)), 100 ether);
		string memory signature = "transfer(address,uint256)";
		bytes memory data = abi.encode(
			address(this), 100 ether
		);
		uint256 value = 0;
		// Not Owner
		vm.expectRevert("OptimisticTreasury: caller is not the owner");
		oTreasury.executeTransaction(address(dai), value, signature, data);

		// Empty address
		vm.expectRevert("ITreasury::executeTransaction: target can't be zero");
		ol2.executeTransaction(oTreasury, address(0),value, signature,data);

		ol2.executeTransaction(oTreasury, address(dai),value, signature,data);
		assertEq(dai.balanceOf(address(this)),100 ether);
		assertEq(dai.balanceOf(address(oTreasury)), 0 ether);
	}
}
