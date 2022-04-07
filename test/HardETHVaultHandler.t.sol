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
	address user2 = address(0x2);

	//// Params
	uint256 divisor = 10000000000;
	uint256 ratio = 110;
	uint256 burnFee = 1;
	uint256 liquidationPenalty = 5;
	address treasury = address(0x3);

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

		ETHVaultHandler vault = new ETHVaultHandler(
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

		if (!(_burnFee > 10)) {
			assertEq(_burnFee, vault.burnFee());
		}
	}

	function testValidateConstructorRatioAndPenalty(uint256 _liquidationPenalty, uint256 _ratio) public {
		if (_liquidationPenalty + 100 < _liquidationPenalty) {
			return;
		}

		if ((_liquidationPenalty + 100) >= _ratio) {
			vm.expectRevert("VaultHandler::constructor: liquidation penalty too high");
		}

		ETHVaultHandler vault = new ETHVaultHandler(
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

		if (!((_liquidationPenalty + 100) >= _ratio)) {
			assertEq(_liquidationPenalty, vault.liquidationPenalty());
		}
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
		(,, debt,) = ethVault.vaults(1);
		assertEq(debt, 30 ether);
	}

	function testBurnTCAP_ShouldRevert_WhenFeeIsNotPaid(uint96 _tcapAmount) public {
		// checks
		if (_tcapAmount < 1 ether) {
			return;
		}

		// setUp
		uint256 t = 1 wei;
		orchestrator.executeTransaction(address(ethVault), 0, "setMinimumTCAP(uint256)", abi.encode(1 ether));
		vm.startPrank(user);
		uint256 requiredCollateral = ethVault.requiredCollateral(_tcapAmount);
		uint256 fee = ethVault.getFee(_tcapAmount);
		vm.deal(user, requiredCollateral + t + fee);
		ethVault.createVault();
		ethVault.addCollateralETH{value : requiredCollateral + t}();
		emit log_named_uint("Required Collateral", requiredCollateral);
		emit log_named_uint("Vault Ratio", ethVault.getVaultRatio(1));
		ethVault.mint(_tcapAmount);

		// execution
		ethVault.burn{value : fee}(_tcapAmount);

		// assert
		(uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault.vaults(1);
		assertEq(id, 1);
		assertEq(collateral, requiredCollateral + t);
		assertEq(debt, 0);
		assertEq(owner, user);
	}

	function testBurnTCAP_ShouldBurn_WhenFeeIsPaid(uint96 _tcapAmount) public {
		// checks
		if (_tcapAmount < 1 ether) {
			return;
		}

		// setUp
		uint256 t = 1 wei;
		orchestrator.executeTransaction(address(ethVault), 0, "setMinimumTCAP(uint256)", abi.encode(1 ether));
		vm.startPrank(user);
		uint256 requiredCollateral = ethVault.requiredCollateral(_tcapAmount);
		vm.deal(user, requiredCollateral + t);
		ethVault.createVault();
		ethVault.addCollateralETH{value : requiredCollateral + t}();
		ethVault.mint(_tcapAmount);

		// execution
		vm.expectRevert("VaultHandler::burn: burn fee less than required");
		ethVault.burn(_tcapAmount);

		// assert
		(uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault.vaults(1);
		assertEq(id, 1);
		assertEq(collateral, requiredCollateral + t);
		assertEq(debt, _tcapAmount);
		assertEq(owner, user);
	}


	function testLiquidateVault_ShouldLiquidateVault(uint96 _priceIncrease) public {
		if (_priceIncrease == 0) return;
		// setUp
		uint96 _tcapAmount = 1 ether;
		uint256 t = 1 wei;
		orchestrator.executeTransaction(address(ethVault), 0, "setMinimumTCAP(uint256)", abi.encode(1 ether));
		vm.startPrank(user);
		uint256 requiredCollateral = ethVault.requiredCollateral(_tcapAmount);
		vm.deal(user, requiredCollateral + t);
		ethVault.createVault();
		ethVault.addCollateralETH{value : requiredCollateral + t}();
		ethVault.mint(_tcapAmount);
		(, uint256 collateralOld, uint256 debtOld,) = ethVault.vaults(1);

		vm.stopPrank();
		vm.startPrank(user2);
		vm.deal(user2, requiredCollateral + t);
		ethVault.createVault();
		ethVault.addCollateralETH{value : requiredCollateral + t}();
		ethVault.mint(_tcapAmount);

		// execution
		// change price of TCAP
		tcapAggregator.setLatestAnswer(int256(_priceIncrease));
		uint256 reward = 0;
		if (!(ethVault.getVaultRatio(1) < ratio && ethVault.getVaultRatio(1) >= 100)) {
			return;
		}

		uint256 requiredLiquidation = ethVault.requiredLiquidationTCAP(1);
		reward = ethVault.liquidationReward(1);
		uint256 fee = ethVault.getFee(_tcapAmount);
		vm.deal(user2, fee);
		ethVault.liquidateVault{value : fee}(1, requiredLiquidation);


		// assert
		(uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault.vaults(1);
		assertEq(id, 1);
		assertEq(collateral, collateralOld - reward);
		assertEq(debt, debtOld - requiredLiquidation);
		assertEq(owner, user);
	}
}
