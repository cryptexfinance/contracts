// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "forge-std/Test.sol";
import "../../contracts/ETHVaultHandler.sol";
import "../../contracts/Orchestrator.sol";
import "../../contracts/TCAP.sol";
import "../../contracts/oracles/ChainlinkOracle.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract JPEGzMainnetTest is Test {
  // events
  event NewMinimumTCAP(address indexed _owner, uint256 _minimumTCAP);
  event NewMintFee(address indexed _owner, uint256 _mintFee);
  event NewBurnFee(address indexed _owner, uint256 _burnFee);

  // Setup
  ETHVaultHandler ethVault;
  Orchestrator orchestrator = new Orchestrator(address(this));
  TCAP jpegz = new TCAP("JPEGz Token", "JPEGz", 0, (orchestrator));
  AggregatorV3Interface jpegzAggregator =
    AggregatorV3Interface(0x8D0e319eBAA8DF32e088e469062F85abF2eBe599);
  AggregatorV3Interface ethAggregator =
    AggregatorV3Interface(0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612);
  ChainlinkOracle jpegzOracle =
    new ChainlinkOracle(address(jpegzAggregator), address(this));
  ChainlinkOracle ethOracle =
    new ChainlinkOracle(address(ethAggregator), address(this));
  address weth = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;
  address user = address(0x1);
  address user2 = address(0x2);

  //// Params
  uint256 divisor = 1000000000;
  uint256 ratio = 150;
  uint256 burnFee = 150;
  uint256 mintFee = 150;
  uint256 liquidationPenalty = 20;
  address treasury = address(0x3);

  function setUp() public {
    ethVault = new ETHVaultHandler(
      orchestrator,
      divisor,
      ratio,
      burnFee,
      mintFee,
      liquidationPenalty,
      address(jpegzOracle),
      jpegz,
      address(weth),
      address(ethOracle),
      address(ethOracle),
      treasury,
      0 ether
    );

    orchestrator.addTCAPVault(jpegz, ethVault);
  }

  function testConstructor_ShouldSetParams_WhenInitialized() public {
    assertEq(address(orchestrator), ethVault.owner());
    assertEq(divisor, ethVault.divisor());
    assertEq(ratio, ethVault.ratio());
    assertEq(burnFee, ethVault.burnFee());
    assertEq(burnFee, ethVault.mintFee());
    assertEq(liquidationPenalty, ethVault.liquidationPenalty());
    assertEq(address(jpegzOracle), address(ethVault.tcapOracle()));
    assertEq(address(jpegz), address(ethVault.TCAPToken()));
    assertEq(address(weth), address(ethVault.collateralContract()));
    assertEq(address(ethOracle), address(ethVault.collateralPriceOracle()));
    assertEq(address(ethOracle), address(ethVault.ETHPriceOracle()));
    assertEq(treasury, ethVault.treasury());
    assertEq(0 ether, ethVault.minimumTCAP());
  }

  function testConstructor_ShouldRevert_WhenBurnFeeIsHigh(uint256 _burnFee)
    public
  {
    if (_burnFee > 1000) {
      vm.expectRevert("VaultHandler::constructor: fee higher than MAX_FEE");
    }

    ETHVaultHandler vault = new ETHVaultHandler(
      orchestrator,
      divisor,
      ratio,
      _burnFee,
      mintFee,
      liquidationPenalty,
      address(jpegzOracle),
      jpegz,
      address(weth),
      address(ethOracle),
      address(ethOracle),
      treasury,
      0
    );

    if (!(_burnFee > 1000)) {
      assertEq(_burnFee, vault.burnFee());
    }
  }

  function testConstructor_ShouldRevert_WhenMintFeeIsHigh(uint256 _mintFee)
    public
  {
    vm.assume(_mintFee > 1000);

    vm.expectRevert("VaultHandler::constructor: fee higher than MAX_FEE");
    new ETHVaultHandler(
      orchestrator,
      divisor,
      ratio,
      burnFee,
      _mintFee,
      liquidationPenalty,
      address(jpegzOracle),
      jpegz,
      address(weth),
      address(ethOracle),
      address(ethOracle),
      treasury,
      0
    );
  }

  function testConstructor_ShouldRevert_WhenLiquidationPenaltyIsHigh(
    uint256 _liquidationPenalty,
    uint256 _ratio
  ) public {
    if (_liquidationPenalty + 100 < _liquidationPenalty) {
      return;
    }

    if ((_liquidationPenalty + 100) >= _ratio) {
      vm.expectRevert(
        "VaultHandler::constructor: liquidation penalty too high"
      );
    }

    ETHVaultHandler vault = new ETHVaultHandler(
      orchestrator,
      divisor,
      _ratio,
      burnFee,
      mintFee,
      _liquidationPenalty,
      address(jpegzOracle),
      jpegz,
      address(weth),
      address(ethOracle),
      address(ethOracle),
      treasury,
      0
    );

    if (!((_liquidationPenalty + 100) >= _ratio)) {
      assertEq(_liquidationPenalty, vault.liquidationPenalty());
    }
  }

  function testSetLiquidationPenalty_ShouldUpdateValue(
    uint256 _liquidationPenalty
  ) public {
    if (_liquidationPenalty + 100 < _liquidationPenalty) {
      return;
    }

    if ((_liquidationPenalty + 100) >= ratio) {
      vm.expectRevert(
        "VaultHandler::setLiquidationPenalty: liquidation penalty too high"
      );
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

  function testSetMinimumTCAP_ShouldUpdateValue(uint256 _minimumTCAP) public {
    vm.expectRevert("Ownable: caller is not the owner");
    ethVault.setMinimumTCAP(_minimumTCAP);

    vm.expectEmit(true, true, true, true);
    emit NewMinimumTCAP(address(orchestrator), _minimumTCAP);
    orchestrator.executeTransaction(
      address(ethVault),
      0,
      "setMinimumTCAP(uint256)",
      abi.encode(_minimumTCAP)
    );
    assertEq(ethVault.minimumTCAP(), _minimumTCAP);
  }

  function testMint_ShouldCreateTCAP_WhenFeeIsPaid() public {
    uint256 fee = ethVault.getMintFee(1 ether);
    vm.startPrank(user);
    vm.deal(user, 100 ether);
    ethVault.createVault();
    ethVault.addCollateralETH{value: 10 ether}();
    ethVault.mint{value: fee}(1 ether);

    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(id, 1);
    assertEq(collateral, 10 ether);
    assertEq(debt, 1 ether);
    assertEq(owner, user);
    assertEq(address(treasury).balance, fee);
  }

  function testMint_ShouldGiveBackETH_WhenFeeIsHigh() public {
    uint256 fee = ethVault.getMintFee(1 ether);
    vm.startPrank(user);
    vm.deal(user, 100 ether);
    ethVault.createVault();
    ethVault.addCollateralETH{value: 10 ether}();
    ethVault.mint{value: 10 ether}(1 ether);

    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(id, 1);
    assertEq(collateral, 10 ether);
    assertEq(debt, 1 ether);
    assertEq(owner, user);
    assertEq(address(treasury).balance, fee);
    assertTrue(user.balance > 10 ether - ethVault.getMintFee(1 ether));
  }

  function testMint_ShouldFail_WhenFeeIsNotPaid() public {
    vm.startPrank(user);
    vm.deal(user, 100 ether);
    ethVault.createVault();
    ethVault.addCollateralETH{value: 10 ether}();
    vm.expectRevert("VaultHandler::mint: mint fee less than required");
    ethVault.mint(1 ether);

    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(id, 1);
    assertEq(collateral, 10 ether);
    assertEq(debt, 0 ether);
    assertEq(owner, user);
  }

  function testMint_ShouldMint_WhenEnoughCAP() public {
    // setup
    orchestrator.executeTransaction(
      address(ethVault),
      0,
      "setMinimumTCAP(uint256)",
      abi.encode(20 ether)
    );
    uint256 fee = ethVault.getMintFee(20 ether);
    vm.startPrank(user);
    vm.deal(user, 100 ether);
    ethVault.createVault();
    ethVault.addCollateralETH{value: 10 ether}();

    // execution
    vm.expectRevert("VaultHandler::mint: mint amount less than required");
    ethVault.mint{value: fee}(1 ether);

    ethVault.mint{value: fee}(20 ether);
    ethVault.mint{value: fee}(1 ether);

    //asserts
    (, , uint256 debt, ) = ethVault.vaults(1);
    assertEq(debt, 21 ether);

    // setup
    vm.stopPrank();
    orchestrator.executeTransaction(
      address(ethVault),
      0,
      "setMinimumTCAP(uint256)",
      abi.encode(30 ether)
    );

    // execution
    vm.startPrank(user);
    vm.expectRevert("VaultHandler::mint: mint amount less than required");
    ethVault.mint{value: fee}(1 ether);
    ethVault.mint{value: fee}(9 ether);

    // asserts
    (, , debt, ) = ethVault.vaults(1);
    assertEq(debt, 30 ether);
  }

  function testBurnTCAP_ShouldBurn_WhenFeeIsPaid(uint96 _tcapAmount) public {
    // checks
    if (_tcapAmount < 1 ether) {
      return;
    }

    // setUp
    uint256 t = 1 wei;
    orchestrator.executeTransaction(
      address(ethVault),
      0,
      "setMinimumTCAP(uint256)",
      abi.encode(1 ether)
    );
    vm.startPrank(user);
    uint256 requiredCollateral = ethVault.requiredCollateral(_tcapAmount);
    uint256 mfee = ethVault.getBurnFee(_tcapAmount);
    uint256 bfee = ethVault.getBurnFee(_tcapAmount);
    vm.deal(user, requiredCollateral + t + mfee + bfee);
    ethVault.createVault();
    ethVault.addCollateralETH{value: requiredCollateral + t}();
    ethVault.mint{value: mfee}(_tcapAmount);

    // execution
    ethVault.burn{value: bfee}(_tcapAmount);

    // assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(id, 1);
    assertEq(collateral, requiredCollateral + t);
    assertEq(debt, 0);
    assertEq(owner, user);
  }

  function testBurnTCAP_ShouldRevert_WhenFeeIsNotPaid(uint96 _tcapAmount)
    public
  {
    // setUp
    vm.assume(_tcapAmount > 1 ether);
    uint256 t = 1 wei;
    orchestrator.executeTransaction(
      address(ethVault),
      0,
      "setMinimumTCAP(uint256)",
      abi.encode(1 ether)
    );
    uint256 mfee = ethVault.getMintFee(_tcapAmount);
    vm.startPrank(user);
    uint256 requiredCollateral = ethVault.requiredCollateral(_tcapAmount);
    vm.deal(user, requiredCollateral + t + mfee);
    ethVault.createVault();
    ethVault.addCollateralETH{value: requiredCollateral + t}();
    ethVault.mint{value: mfee}(_tcapAmount);

    // execution
    vm.expectRevert("VaultHandler::burn: burn fee less than required");
    ethVault.burn(_tcapAmount);

    // assert
    (uint256 id, uint256 collateral, uint256 debt, address owner) = ethVault
      .vaults(1);
    assertEq(id, 1);
    assertEq(collateral, requiredCollateral + t);
    assertEq(debt, _tcapAmount);
    assertEq(owner, user);
  }

  function testSetBurnFee_ShouldRevert_WhenValueAboveMax(uint256 _newFee)
    public
  {
    //setUp
    vm.assume(_newFee > 1000);
    uint256 oldFee = ethVault.burnFee();
    vm.expectRevert("VaultHandler::setBurnFee: fee higher than MAX_FEE");

    //execution
    orchestrator.setBurnFee(ethVault, _newFee);

    //assert
    assertEq(oldFee, ethVault.burnFee());
  }

  function testSetBurnFee_ShouldAllowDecimals_WhenValueBelowMax(uint256 _newFee)
    public
  {
    //setUp
    if (_newFee > 1000) {
      return;
    }

    //execution
    vm.expectEmit(true, true, true, true);
    emit NewBurnFee(address(orchestrator), _newFee);
    orchestrator.setBurnFee(ethVault, _newFee);

    //assert
    assertEq(ethVault.burnFee(), _newFee);
  }

  function testSetMintFee_ShouldRevert_WhenNotCalledByOwner() public {
    //setUp
    uint256 oldFee = ethVault.mintFee();
    vm.expectRevert("Ownable: caller is not the owner");

    //execution
    ethVault.setMintFee(2);

    //assert
    assertEq(oldFee, ethVault.mintFee());
  }

  function testSetMintFee_ShouldRevert_WhenValueAboveMax(uint256 _newFee)
    public
  {
    //setUp
    vm.assume(_newFee > 1000);
    uint256 oldFee = ethVault.mintFee();
    vm.expectRevert("VaultHandler::setMintFee: fee higher than MAX_FEE");

    //execution
    orchestrator.setMintFee(ethVault, _newFee);

    //assert
    assertEq(oldFee, ethVault.mintFee());
  }

  function testSetMintFee_ShouldAllowDecimals_WhenValueBelowMax(uint256 _newFee)
    public
  {
    //setUp
    if (_newFee > 1000) {
      return;
    }

    //execution
    vm.expectEmit(true, true, true, true);
    emit NewMintFee(address(orchestrator), _newFee);
    orchestrator.setMintFee(ethVault, _newFee);

    //assert
    assertEq(ethVault.mintFee(), _newFee);
  }

  function testGetMintFee_ShouldCalculateCorrectValue(
    uint8 _mintFee,
    uint96 _amount
  ) public {
    //setUp
    if (_mintFee > 1000) {
      return;
    }
    orchestrator.setMintFee(ethVault, _mintFee);
    uint256 calculatedFee = (ethVault.TCAPPrice() * (_amount) * (_mintFee)) /
      (10000) /
      (ethVault.getOraclePrice(ethOracle));

    //execution
    uint256 currentFee = ethVault.getMintFee(_amount);

    //assert
    assertEq(calculatedFee, currentFee);
  }

  function testGetBurnFee_ShouldCalculateCorrectValue(
    uint8 _burnFee,
    uint96 _amount
  ) public {
    //setUp
    if (_burnFee > 1000) {
      return;
    }
    orchestrator.setBurnFee(ethVault, _burnFee);
    uint256 calculatedFee = (ethVault.TCAPPrice() * (_amount) * (_burnFee)) /
      (10000) /
      (ethVault.getOraclePrice(ethOracle));

    //execution
    uint256 currentFee = ethVault.getBurnFee(_amount);

    //assert
    assertEq(calculatedFee, currentFee);
  }

  function testOracleValues_ShouldBeCorrect_WhenCalled() public {
    //setUp
    uint80 round = 18446744073709551624; //latest round when test was created

    //execution
    (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    ) = jpegzAggregator.getRoundData(round);

    //assert
    assert(roundId == 18446744073709551624);
    assertEq(answer, 300946277263786940);
    assertEq(startedAt, 1674749362);
    assertEq(updatedAt, 1674749362);
    assert(answeredInRound == 18446744073709551624);
  }
}
