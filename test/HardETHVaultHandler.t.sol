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
	ETHVaultHandler ethVault;
	Orchestrator orchestrator = new Orchestrator(address(this));
	TCAP tcap = new TCAP("Total Crypto Market Cap Token", "TCAP", 0, (orchestrator));
	AggregatorInterfaceTCAP tcapAggregator = new AggregatorInterfaceTCAP();
	AggregatorInterface ethAggregator = new AggregatorInterface();
	ChainlinkOracle tcapOracle = new ChainlinkOracle(address(tcapAggregator), address(this));
	ChainlinkOracle ethOracle = new ChainlinkOracle(address(ethAggregator), address(this));
	WETH weth = new WETH();



	////Params
	address _orchestrator = address(orchestrator);
	uint256 _divisor = 10000000000;
	uint256 _ratio = 200;
	uint256 _burnFee = 1;
	uint256 _liquidationPenalty = 10;
	address _tcapOracle = address(tcapOracle);
	address _tcapAddress = address(tcap);
	address _collateralAddress = address(weth);
	address _collateralOracle = address(ethOracle);
	address _ethOracle = address(ethOracle);
	address _treasury = address(0x1);


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
	}
}
