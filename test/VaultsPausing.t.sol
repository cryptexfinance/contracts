// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "forge-std/Test.sol";
import "../contracts/ETHVaultHandler.sol";
import "../contracts/Orchestrator.sol";
import "../contracts/oracles/ChainlinkOracle.sol";
import "../contracts/mocks/AggregatorInterfaceTCAP.sol";
import "../contracts/mocks/AggregatorInterface.sol";
import "../contracts/mocks/WETH.sol";

contract VaultPausingTest is Test {
  // events
  event FunctionIsPaused(
    address indexed _owner,
    uint256 _function,
    bool _isPaused
  );

  // Setup
  ETHVaultHandler ethVault;
  Orchestrator orchestrator = new Orchestrator(address(this));
  TCAP tcap =
    new TCAP("Total Crypto Market Cap Token", "TCAP", 0, (orchestrator));
  AggregatorInterfaceTCAP tcapAggregator = new AggregatorInterfaceTCAP();
  AggregatorInterface ethAggregator = new AggregatorInterface();
  ChainlinkOracle tcapOracle =
    new ChainlinkOracle(address(tcapAggregator), address(this));
  ChainlinkOracle ethOracle =
    new ChainlinkOracle(address(ethAggregator), address(this));
  WETH weth = new WETH();
  address user = address(0x1);
  address user2 = address(0x2);

  //// Params
  uint256 divisor = 10000000000;
  uint256 ratio = 110;
  uint256 burnFee = 50;
  uint256 liquidationPenalty = 5;
  address treasury = address(0x3);

  function setUp() public {
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
      treasury,
      1 ether
    );

    orchestrator.addTCAPVault(tcap, ethVault);
  }

  // Only Owner
  //Should be able to pause function

  //Should be able to unpause function

  //Other functions should be able to keep functioning after one is paused

  function testTogglePauseFunction_ShouldRevert_WhenNotOwner() public {
    //setUp
    vm.expectRevert("Ownable: caller is not the owner");

    //execution
    ethVault.togglePauseFunction(1, true);

    //assert
    assertEq(ethVault.isPaused(1), false);
  }

  function testTogglePauseFunction_ShouldPauseFunction() public {
    //setUp
    vm.startPrank(address(orchestrator));
    vm.expectEmit(true, true, true, true);
    emit FunctionIsPaused(address(orchestrator), 1, true);

    //execution
    ethVault.togglePauseFunction(1, true);

    //assert
    assertEq(ethVault.isPaused(1), true);
  }

  function testCreateVault_ShouldRevert_WhenIsPaused() public {
    //setUp
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(1, true);
    vm.startPrank(user);
    vm.expectRevert("VaultHandler::createVault: function is paused");

    //execution
    ethVault.createVault();

    //assert
    assertEq(ethVault.userToVault(user), 0);
  }

  function testCreateVault_ShouldWork_WhenTooglePausedFalse() public {
    //setUp
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(1, true);
    vm.prank(user);
    vm.expectRevert("VaultHandler::createVault: function is paused");
    ethVault.createVault();
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(1, false);
    //execution
    vm.prank(user);
    ethVault.createVault();

    //assert
    assertEq(ethVault.userToVault(user), 1);
  }

  function testAddCollateral_ShouldRevert_WhenIsPaused() public {
    //setUp
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(2, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    weth.deposit{value: amount}();
    weth.approve(address(ethVault), amount);
    ethVault.createVault();
    vm.expectRevert("VaultHandler::addCollateral: function is paused");

    //execution
    ethVault.addCollateral(amount);

    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 0);
    assertEq(debt, 0);
    assertEq(owner, user);
  }

  function testAddCollateralETH_ShouldRevert_WhenIsPaused() public {
    //setup
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(2, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    ethVault.createVault();
    vm.expectRevert("VaultHandler::addCollateralETH: function is paused");
    //execution
    ethVault.addCollateralETH{value: amount}();

    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 0);
    assertEq(debt, 0);
    assertEq(owner, user);
  }

  function testAddCollateral_ShouldWork_WhenTooglePausedFalse() public {
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(2, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    weth.deposit{value: amount}();
    weth.approve(address(ethVault), amount);
    ethVault.createVault();
    vm.expectRevert("VaultHandler::addCollateral: function is paused");
    //execution
    ethVault.addCollateral(amount);
    vm.stopPrank();
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(2, false);
    vm.prank(user);
    ethVault.addCollateral(amount);
    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, amount);
    assertEq(debt, 0);
    assertEq(owner, user);
  }

  function testAddCollateralETH_ShouldWork_WhenTooglePausedFalse() public {
    //setUp
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(2, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    ethVault.createVault();

    //execution
    vm.expectRevert("VaultHandler::addCollateralETH: function is paused");
    ethVault.addCollateralETH{value: amount}();
    vm.stopPrank();
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(2, false);
    vm.prank(user);
    ethVault.addCollateralETH{value: amount}();
    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, amount);
    assertEq(debt, 0);
    assertEq(owner, user);
  }

  function testRemoveCollateral_ShouldRevert_WhenIsPaused() public {
    //setup
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(3, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    ethVault.createVault();
    ethVault.addCollateralETH{value: amount}();
    vm.expectRevert("VaultHandler::removeCollateral: function is paused");

    //execution
    ethVault.removeCollateral(amount);

    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 1 ether);
    assertEq(debt, 0);
    assertEq(owner, user);
  }

  function testRemoveCollateralETH_ShouldRevert_WhenIsPaused() public {
    //setup
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(3, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    ethVault.createVault();
    ethVault.addCollateralETH{value: amount}();
    vm.expectRevert("VaultHandler::removeCollateralETH: function is paused");

    //execution
    ethVault.removeCollateralETH(amount);

    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 1 ether);
    assertEq(debt, 0);
    assertEq(owner, user);
  }

  function testRemoveCollateral_ShouldWork_WhenTooglePausedFalse() public {
    //setup
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(3, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    ethVault.createVault();
    ethVault.addCollateralETH{value: amount}();
    vm.expectRevert("VaultHandler::removeCollateral: function is paused");
    ethVault.removeCollateral(amount);
    vm.stopPrank();
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(3, false);

    //execution
    vm.prank(user);
    ethVault.removeCollateral(amount);

    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 0);
    assertEq(debt, 0);
    assertEq(owner, user);
  }

  function testRemoveCollateralETH_ShouldWork_WhenTooglePausedFalse() public {
    //setup
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(3, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    ethVault.createVault();
    ethVault.addCollateralETH{value: amount}();
    vm.expectRevert("VaultHandler::removeCollateralETH: function is paused");
    ethVault.removeCollateralETH(amount);
    vm.stopPrank();
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(3, false);

    //execution
    vm.prank(user);
    ethVault.removeCollateralETH(amount);

    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 0);
    assertEq(debt, 0);
    assertEq(owner, user);
  }

  function testMint_ShouldRevert_WhenIsPaused() public {
    //setup
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(4, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    ethVault.createVault();
    ethVault.addCollateralETH{value: amount}();
    vm.expectRevert("VaultHandler::mint: function is paused");

    //execution
    ethVault.mint(1 ether);

    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 1 ether);
    assertEq(debt, 0);
    assertEq(owner, user);
  }

  function testMint_ShouldWork_WhenTooglePausedFalse() public {
    //setup
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(4, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    ethVault.createVault();
    ethVault.addCollateralETH{value: amount}();
    vm.expectRevert("VaultHandler::mint: function is paused");
    ethVault.mint(1 ether);
    vm.stopPrank();
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(4, false);

    //execution
    vm.prank(user);
    ethVault.mint(1 ether);

    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 1 ether);
    assertEq(debt, 1 ether);
    assertEq(owner, user);
  }

  function testBurn_ShouldNotBurn_WhenIsPaused() public {
    //setup
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(5, true);
    vm.startPrank(user);
    vm.deal(user, amount * 2);
    ethVault.createVault();
    ethVault.addCollateralETH{value: amount}();
    ethVault.mint(1 ether);
    uint256 fee = ethVault.getFee(amount);

    //execution
    vm.expectRevert("VaultHandler::burn: function is paused");
    ethVault.burn{value: fee}(1 ether);

    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 1 ether);
    assertEq(debt, 1 ether);
    assertEq(owner, user);
  }

  function testBurn_ShouldWork_WhenTooglePausedFalse() public {
    //setup
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(5, true);
    vm.startPrank(user);
    vm.deal(user, amount * 2);
    ethVault.createVault();
    ethVault.addCollateralETH{value: amount}();
    ethVault.mint(1 ether);
    uint256 fee = ethVault.getFee(amount);
    vm.expectRevert("VaultHandler::burn: function is paused");
    ethVault.burn{value: fee}(1 ether);
    vm.stopPrank();
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(5, false);

    //execution
    vm.prank(user);
    ethVault.burn{value: fee}(1 ether);

    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 1 ether);
    assertEq(debt, 0 ether);
    assertEq(owner, user);
  }

  function testLiquidateVault_ShouldNotLiquidate_WhenIsPaused() public {
    //setup
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(6, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    vm.deal(user2, amount * 2);
    ethVault.createVault();
    ethVault.addCollateralETH{value: amount}();
    ethVault.mint(1 ether);
    uint256 fee = ethVault.getFee(amount);
    vm.stopPrank();

    //execution
    vm.expectRevert("VaultHandler::liquidateVault: function is paused");
    vm.startPrank(user2);
    ethVault.liquidateVault{value: fee}(1, 1 ether);

    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 1 ether);
    assertEq(debt, 1 ether);
    assertEq(owner, user);
  }

  function testLiquidateVault_ShouldWork_WhenTooglePausedFalse() public {
    //setup
    uint256 amount = 1 ether;
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(6, true);
    vm.startPrank(user);
    vm.deal(user, amount);
    vm.deal(user2, amount * 2);
    ethVault.createVault();
    ethVault.addCollateralETH{value: amount}();
    ethVault.mint(9 ether);
    tcap.transfer(user2, 9 ether);
    uint256 fee = ethVault.getFee(amount);
    vm.stopPrank();
    vm.expectRevert("VaultHandler::liquidateVault: function is paused");
    vm.prank(user2);
    ethVault.liquidateVault{value: fee}(1, 1 ether);
    vm.prank(address(orchestrator));
    ethVault.togglePauseFunction(6, false);
    tcapAggregator.setLatestAnswer(50129732288636297500);
    emit log_uint(ethVault.getVaultRatio(1));
    fee = ethVault.getFee(9 ether);

    //execution
    vm.prank(user2);
    ethVault.liquidateVault{value: fee}(1, 9 ether);
    //assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(ethVault.userToVault(user), 1);
    assertEq(id, 1);
    assertEq(collateral, 0 ether);
    assertEq(debt, 0);
    assertEq(owner, user);
  }
}
