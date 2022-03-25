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
	Vm vm;

	//Setup
	ETHVaultHandler ethVault;
	Orchestrator orchestrator = new Orchestrator(address(this));
	TCAP tcap = new TCAP("Total Crypto Market Cap Token", "TCAP", 0, (orchestrator));
	AggregatorInterfaceTCAP tcapAggregator = new AggregatorInterfaceTCAP();
	AggregatorInterface ethAggregator = new AggregatorInterface();
	ChainlinkOracle tcapOracle = new ChainlinkOracle(address(tcapAggregator), address(this));
	ChainlinkOracle ethOracle = new ChainlinkOracle(address(ethAggregator), address(this));
	WETH weth = new WETH();
	address user = address(0x1);

	////Params
	address _orchestrator = address(orchestrator);
	uint256 _divisor = 10000000000;
	uint256 _ratio = 150;
	uint256 _burnFee = 1;
	uint256 _liquidationPenalty = 10;
	address _tcapOracle = address(tcapOracle);
	address _tcapAddress = address(tcap);
	address _collateralAddress = address(weth);
	address _collateralOracle = address(ethOracle);
	address _ethOracle = address(ethOracle);
	address _treasury = address(0x2);

	// events
	event NewMinimumTCAP(
		address indexed _owner,
		uint256 _minimumTCAP
	);

	function setUp() public {
		vm = Vm(HEVM_ADDRESS);
		ethVault = new ETHVaultHandler(
			orchestrator,
			_divisor,
			_ratio,
			_burnFee,
			_liquidationPenalty,
			_tcapOracle,
			tcap,
			_collateralAddress,
			_collateralOracle,
			_ethOracle,
			_treasury);

		orchestrator.addTCAPVault(tcap, ethVault);
	}

	function testSetParams() public {
		assertEq(_orchestrator, ethVault.owner());
		assertEq(_divisor, ethVault.divisor());
		assertEq(_ratio, ethVault.ratio());
		assertEq(_burnFee, ethVault.burnFee());
		assertEq(_liquidationPenalty, ethVault.liquidationPenalty());
		assertEq(_tcapOracle, address(ethVault.tcapOracle()));
		assertEq(_tcapAddress, address(ethVault.TCAPToken()));
		assertEq(_collateralAddress, address(ethVault.collateralContract()));
		assertEq(_collateralOracle, address(ethVault.collateralPriceOracle()));
		assertEq(_ethOracle, address(ethVault.ETHPriceOracle()));
		assertEq(_treasury, ethVault.treasury());
		assertEq(0, ethVault.minimumTCAP());
	}

	function testValidateConstructorBurnFee(uint256 b) public {
		if (b > 10) {
			vm.expectRevert("VaultHandler::constructor: burn fee higher than MAX_FEE");
		}

		new ETHVaultHandler(
			orchestrator,
			_divisor,
			_ratio,
			b,
			_liquidationPenalty,
			_tcapOracle,
			tcap,
			_collateralAddress,
			_collateralOracle,
			_ethOracle,
			_treasury);

	}

	function testValidateConstructorRatioAndPenalty(uint256 lp, uint256 r) public {
		if (lp + 100 < lp) {
			return;
		}
		if ((lp + 100) >= r) {
			vm.expectRevert("VaultHandler::constructor: liquidation penalty too high");
		}

		new ETHVaultHandler(
			orchestrator,
			_divisor,
			r,
			_burnFee,
			lp,
			_tcapOracle,
			tcap,
			_collateralAddress,
			_collateralOracle,
			_ethOracle,
			_treasury);
	}


	function testShouldUpdateLiquidationPenalty(uint256 lp) public {
		if (lp + 100 < lp) {
			return;
		}

		if ((lp + 100) >= _ratio) {
			vm.expectRevert("VaultHandler::setLiquidationPenalty: liquidation penalty too high");
		}

		orchestrator.setLiquidationPenalty(ethVault, lp);
	}

	function testShouldUpdateRatio(uint256 r) public {
		if (r < 100) {
			vm.expectRevert("VaultHandler::setRatio: ratio lower than MIN_RATIO");
		} else {
			if (ethVault.liquidationPenalty() + 100 >= r) {
				vm.expectRevert("VaultHandler::setRatio: liquidation penalty too high");
			}
		}
		orchestrator.setRatio(ethVault, r);
	}

	function testShouldUpdateMinimumTCAP(uint256 min) public {
		vm.expectRevert("Ownable: caller is not the owner");
		ethVault.setMinimumTCAP(min);

		vm.expectEmit(true, true, true, true);
		emit NewMinimumTCAP(address(orchestrator), min);
		orchestrator.executeTransaction(address(ethVault), 0, "setMinimumTCAP(uint256)", abi.encode(min));
		assertEq(ethVault.minimumTCAP(), min);
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
		orchestrator.executeTransaction(address(ethVault), 0, "setMinimumTCAP(uint256)", abi.encode(20 ether));
		vm.startPrank(user);
		vm.deal(user, 100 ether);
		ethVault.createVault();
		ethVault.addCollateralETH{value : 10 ether}();
		(, uint256 collateral,,) = ethVault.vaults(1);
		assertEq(collateral, 10 ether);

		vm.expectRevert("VaultHandler::mint: mint amount less than required");
		ethVault.mint(1 ether);

		ethVault.mint(20 ether);
		ethVault.mint(1 ether);
		(,,uint256 debt,) = ethVault.vaults(1);
		assertEq(debt, 21 ether);

		vm.stopPrank();
		orchestrator.executeTransaction(address(ethVault), 0, "setMinimumTCAP(uint256)", abi.encode(30 ether));

		vm.startPrank(user);
		vm.expectRevert("VaultHandler::mint: mint amount less than required");
		ethVault.mint(1 ether);
		ethVault.mint(9 ether);
	}
}
