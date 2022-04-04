// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "ds-test/test.sol";
import "./Vm.sol";
import "../contracts/ETHVaultHandler.sol";
import "../contracts/Orchestrator.sol";
import "../contracts/oracles/ChainlinkOracle.sol";
import "../contracts/mocks/AggregatorInterfaceTCAP.sol";
import "../contracts/mocks/AggregatorInterface.sol";
import "../contracts/mocks/WETH.sol";


contract ETHVaultHandlerTest is DSTest {

	// events
	event NewMinimumTCAP(
		address indexed _owner,
		uint256 _minimumTCAP
	);

	// Setup
	Vm vm;
	ETHVaultHandler ethVault;
	Orchestrator orchestrator = new Orchestrator(address(this));
	TCAP tcap = new TCAP("Total Crypto Market Cap Token", "TCAP", 0, (orchestrator));
	AggregatorInterfaceTCAP tcapAggregator = new AggregatorInterfaceTCAP();
	AggregatorInterface ethAggregator = new AggregatorInterface();
	ChainlinkOracle tcapOracle = new ChainlinkOracle(address(tcapAggregator), address(this));
	ChainlinkOracle ethOracle = new ChainlinkOracle(address(ethAggregator), address(this));
	WETH weth = new WETH();
	address user = address(0x1);

	//// Params
	uint256 divisor = 10000000000;
	uint256 ratio = 150;
	uint256 burnFee = 1;
	uint256 liquidationPenalty = 10;
	address treasury = address(0x2);

	function setUp() public {
		vm = Vm(HEVM_ADDRESS);
		ethVault = new ETHVaultHandler(
			orchestrator,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			address(tcapOracle),
			tcap,
			address(weth),
			address(ethOracle),
			address(ethOracle),
			treasury);

		orchestrator.addTCAPVault(tcap, ethVault);
	}

	function testSetParams() public {
		assertEq(address(orchestrator), ethVault.owner());
		assertEq(divisor, ethVault.divisor());
		assertEq(ratio, ethVault.ratio());
		assertEq(burnFee, ethVault.burnFee());
		assertEq(liquidationPenalty, ethVault.liquidationPenalty());
		assertEq(address(tcapOracle), address(ethVault.tcapOracle()));
		assertEq(address(tcap), address(ethVault.TCAPToken()));
		assertEq(address(weth), address(ethVault.collateralContract()));
		assertEq(address(ethOracle), address(ethVault.collateralPriceOracle()));
		assertEq(address(ethOracle), address(ethVault.ETHPriceOracle()));
		assertEq(treasury, ethVault.treasury());
		assertEq(0, ethVault.minimumTCAP());
	}

	function testValidateConstructorBurnFee(uint256 _burnFee) public {
		if (_burnFee > 10) {
			vm.expectRevert("VaultHandler::constructor: burn fee higher than MAX_FEE");
		}

		new ETHVaultHandler(
			orchestrator,
			divisor,
			ratio,
			_burnFee,
			liquidationPenalty,
			address(tcapOracle),
			tcap,
			address(weth),
			address(ethOracle),
			address(ethOracle),
			treasury
		);

	}

	function testValidateConstructorRatioAndPenalty(uint256 _liquidationPenalty, uint256 _ratio) public {
		if (_liquidationPenalty + 100 < _liquidationPenalty) {
			return;
		}

		if ((_liquidationPenalty + 100) >= _ratio) {
			vm.expectRevert("VaultHandler::constructor: liquidation penalty too high");
		}

		new ETHVaultHandler(
			orchestrator,
			divisor,
			_ratio,
			burnFee,
			_liquidationPenalty,
			address(tcapOracle),
			tcap,
			address(weth),
			address(ethOracle),
			address(ethOracle),
			treasury
		);
	}


	function testShouldUpdateLiquidationPenalty(uint256 _liquidationPenalty) public {
		if (_liquidationPenalty + 100 < _liquidationPenalty) {
			return;
		}

		if ((_liquidationPenalty + 100) >= ratio) {
			vm.expectRevert("VaultHandler::setLiquidationPenalty: liquidation penalty too high");
		}

		orchestrator.setLiquidationPenalty(ethVault, _liquidationPenalty);
	}

	function testShouldUpdateRatio(uint256 _ratio) public {
		if (_ratio < 100) {
			vm.expectRevert("VaultHandler::setRatio: ratio lower than MIN_RATIO");
		} else {
			if (ethVault.liquidationPenalty() + 100 >= _ratio) {
				vm.expectRevert("VaultHandler::setRatio: liquidation penalty too high");
			}
		}
		orchestrator.setRatio(ethVault, _ratio);
	}

	function testShouldUpdateMinimumTCAP(uint256 _minimumTCAP) public {
		vm.expectRevert("Ownable: caller is not the owner");
		ethVault.setMinimumTCAP(_minimumTCAP);

		vm.expectEmit(true, true, true, true);
		emit NewMinimumTCAP(address(orchestrator), _minimumTCAP);
		orchestrator.executeTransaction(address(ethVault), 0, "setMinimumTCAP(uint256)", abi.encode(_minimumTCAP));
		assertEq(ethVault.minimumTCAP(), _minimumTCAP);
	}


	function testShouldAllowMintTCAP() public {
		vm.startPrank(user);
		vm.deal(user, 100 ether);
		ethVault.createVault();
		ethVault.addCollateralETH{value : 10 ether}();
		(, uint256 collateral,,) = ethVault.vaults(1);
		assertEq(collateral, 10 ether);

		ethVault.mint(1 ether);
	}

	function testShouldAllowMintWithMinimumTCAP() public {
		// setup
		orchestrator.executeTransaction(address(ethVault), 0, "setMinimumTCAP(uint256)", abi.encode(20 ether));
		vm.startPrank(user);
		vm.deal(user, 100 ether);
		ethVault.createVault();
		ethVault.addCollateralETH{value : 10 ether}();
		(, uint256 collateral,,) = ethVault.vaults(1);

		// execution
		vm.expectRevert("VaultHandler::mint: mint amount less than required");
		ethVault.mint(1 ether);

		ethVault.mint(20 ether);
		ethVault.mint(1 ether);

		//asserts
		(,,uint256 debt,) = ethVault.vaults(1);
		assertEq(debt, 21 ether);


		// setup
		vm.stopPrank();
		orchestrator.executeTransaction(address(ethVault), 0, "setMinimumTCAP(uint256)", abi.encode(30 ether));

		// execution
		vm.startPrank(user);
		vm.expectRevert("VaultHandler::mint: mint amount less than required");
		ethVault.mint(1 ether);
		ethVault.mint(9 ether);

		// asserts
		(,,debt,) = ethVault.vaults(1);
		assertEq(debt, 30 ether);
	}
}
