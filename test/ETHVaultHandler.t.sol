// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "ds-test/test.sol";
import "./Vm.sol";
import "../contracts/HardETHVaultHandler.sol";


contract HardETHVaultHandlerTest is DSTest {
	Vm vm;
	HardETHVaultHandler ethVault;

	//Params
Orchestrator _orchestrator,
uint256 _divisor,
uint256 _ratio,
uint256 _burnFee,
uint256 _liquidationPenalty,
address _tcapOracle,
TCAP _tcapAddress,
address _collateralAddress,
address _collateralOracle,
address _ethOracle,
address _rewardHandler,
address _treasury


	function setUp() public {
		vm = Vm(HEVM_ADDRESS);
	ethVault = new HardETHVaultHandler();
	}

	function testSetParams() public {

	}

	function testRenounceOwnership() public {
		vm.expectRevert("Ownable: caller is not the owner");
		oTreasury.renounceOwnership();
		ol2.renounceOwnership(oTreasury);
		assertEq(oTreasury.owner(), address(0));
	}

	function testTransferOwnership(address _newOwner) public {
		//		vm.expectRevert("OptimisticTreasury: caller is not the owner");
		//		oTreasury.transferOwnership(_newOwner);
		//
		//		if (_newOwner == address(0)) {
		//			vm.expectRevert("OptimisticTreasury: new owner is the zero address");
		//			ol2.transferOwnership(oTreasury, _newOwner);
		//		} else {
		//			ol2.transferOwnership(oTreasury, _newOwner);
		//			assertEq(oTreasury.owner(), _newOwner);
		//		}
	}

	function testRetrieveEth(address _to) public {
		//		vm.deal(address(oTreasury), 1 ether);
		//		assertEq(address(oTreasury).balance, 1 ether);
		//		vm.expectRevert("OptimisticTreasury: caller is not the owner");
		//		oTreasury.retrieveETH(_to);
		//		if (_to == address(0)) {
		//			vm.expectRevert("ITreasury::retrieveETH: address can't be zero");
		//			ol2.retrieveEth(oTreasury, _to);
		//		} else {
		//			ol2.retrieveEth(oTreasury, _to);
		//			assertEq(_to.balance, 1 ether);
		//		}
	}

	function testExecuteTransaction() public {
		//		DAI dai = new DAI();
		//		dai.mint(address(oTreasury), 100 ether);
		//		assertEq(dai.balanceOf(address(oTreasury)), 100 ether);
		//		string memory signature = "transfer(address,uint256)";
		//		bytes memory data = abi.encode(
		//			address(this), 100 ether
		//		);
		//		uint256 value = 0;
		//		// Not Owner
		//		vm.expectRevert("OptimisticTreasury: caller is not the owner");
		//		oTreasury.executeTransaction(address(dai), value, signature, data);
		//
		//		// Empty address
		//		vm.expectRevert("ITreasury::executeTransaction: target can't be zero");
		//		ol2.executeTransaction(oTreasury, address(0), value, signature, data);
		//
		//		ol2.executeTransaction(oTreasury, address(dai), value, signature, data);
		//		assertEq(dai.balanceOf(address(this)), 100 ether);
		//		assertEq(dai.balanceOf(address(oTreasury)), 0 ether);
	}
}
