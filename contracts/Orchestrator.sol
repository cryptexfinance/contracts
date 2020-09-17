///Contract that manages the vaults and initilize their data
///Transfer ownership to orchestrator
//initialize values
// add vault to tcap
// handle timelocks and security
// retrive funds
// should check oracle address
// should check tcap address
// should check vault address
// pause contracts
// un pause contracts

//tcap
//add handlers
//set cap
//enable cap

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/introspection/ERC165Checker.sol";
import "./IVaultHandler.sol";
import "./TCAP.sol";
import "./oracles/ChainlinkOracle.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

//DEBUG
import "@nomiclabs/buidler/console.sol";

contract Orchestrator is Ownable {
  enum VaultFunctions {
    DIVISOR,
    RATIO,
    BURNFEE,
    LIQUIDATION,
    TCAP,
    TCAPORACLE,
    COLLATERAL,
    COLLATERALORACLE,
    ETHORACLE
  }
  mapping(IVaultHandler => bool) public initialized;
  mapping(VaultFunctions => uint256) public timelock;
  //timelock value, timelock value == value
  uint256 private constant _TIMELOCK = 3 days;

  bytes4 private constant _INTERFACE_ID_IVAULT = 0x409e4a0f;
  bytes4 private constant _INTERFACE_ID_TCAP = 0xa9ccee51;
  bytes4 private constant _INTERFACE_ID_CHAINLINK_ORACLE = 0x85be402b;

  modifier notLocked(VaultFunctions _fn) {
    require(
      timelock[_fn] != 0 && timelock[_fn] <= now,
      "Function is timelocked"
    );
    _;
  }

  modifier validVault(IVaultHandler _vault) {
    require(
      ERC165Checker.supportsInterface(address(_vault), _INTERFACE_ID_IVAULT),
      "Not a valid vault"
    );
    _;
  }

  modifier validTCAP(TCAP _tcap) {
    require(
      ERC165Checker.supportsInterface(address(_tcap), _INTERFACE_ID_TCAP),
      "Not a valid TCAP ERC20"
    );
    _;
  }

  modifier validChainlinkOracle(address _oracle) {
    require(
      ERC165Checker.supportsInterface(
        address(_oracle),
        _INTERFACE_ID_CHAINLINK_ORACLE
      ),
      "Not a valid Chainlink Oracle"
    );
    _;
  }

  //CREATED as STACK IS TO DEEP ON INITIALIZE
  function _validChainlinkOracle(address _oracle) private view {
    require(
      ERC165Checker.supportsInterface(
        address(_oracle),
        _INTERFACE_ID_CHAINLINK_ORACLE
      ),
      "Not a valid Chainlink Oracle"
    );
  }

  function initializeVault(
    IVaultHandler _vault,
    uint256 _divisor,
    uint256 _ratio,
    uint256 _burnFee,
    uint256 _liquidationPenalty,
    address _tcapOracle,
    TCAP _tcapAddress,
    address _collateralAddress,
    address _collateralOracle,
    address _ethOracle
  ) public onlyOwner validVault(_vault) validTCAP(_tcapAddress) {
    require(!initialized[_vault], "Contract already initialized");
    _validChainlinkOracle(_tcapOracle);
    _validChainlinkOracle(_collateralOracle);
    _validChainlinkOracle(_ethOracle);
    _vault.initialize(
      _divisor,
      _ratio,
      _burnFee,
      _liquidationPenalty,
      _tcapOracle,
      _tcapAddress,
      _collateralAddress,
      _collateralOracle,
      _ethOracle
    );
    initialized[_vault] = true;
  }

  //unlock timelock
  function unlockVaultFunction(VaultFunctions _fn) public onlyOwner {
    timelock[_fn] = now + _TIMELOCK;
  }

  //unlock timelock for all

  //lock timelock
  function _lockVaultFunction(VaultFunctions _fn) private {
    timelock[_fn] = 0;
  }

  //lock timelock
  function lockVaultFunction(VaultFunctions _fn) public onlyOwner {
    _lockVaultFunction(_fn);
  }

  function setDivisor(IVaultHandler _vault, uint256 _divisor)
    public
    onlyOwner
    notLocked(VaultFunctions.DIVISOR)
    validVault(_vault)
  {
    _vault.setDivisor(_divisor);
    _lockVaultFunction(VaultFunctions.DIVISOR);
  }

  function setRatio(IVaultHandler _vault, uint256 _ratio)
    public
    onlyOwner
    notLocked(VaultFunctions.RATIO)
    validVault(_vault)
  {
    _vault.setRatio(_ratio);
    _lockVaultFunction(VaultFunctions.RATIO);
  }

  function setBurnFee(IVaultHandler _vault, uint256 _burnFee)
    public
    onlyOwner
    notLocked(VaultFunctions.BURNFEE)
    validVault(_vault)
  {
    _vault.setBurnFee(_burnFee);
    _lockVaultFunction(VaultFunctions.BURNFEE);
  }

  function setLiquidationPenalty(
    IVaultHandler _vault,
    uint256 _liquidationPenalty
  ) public onlyOwner notLocked(VaultFunctions.LIQUIDATION) validVault(_vault) {
    _vault.setLiquidationPenalty(_liquidationPenalty);
    _lockVaultFunction(VaultFunctions.LIQUIDATION);
  }

  function setTCAP(IVaultHandler _vault, TCAP _tcap)
    public
    onlyOwner
    notLocked(VaultFunctions.TCAP)
    validVault(_vault)
    validTCAP(_tcap)
  {
    _vault.setTCAPContract(_tcap);
    _lockVaultFunction(VaultFunctions.TCAP);
  }

  function setTCAPOracle(IVaultHandler _vault, address _tcapOracle)
    public
    onlyOwner
    notLocked(VaultFunctions.TCAPORACLE)
    validVault(_vault)
    validChainlinkOracle(_tcapOracle)
  {
    _vault.setTCAPOracle(ChainlinkOracle(_tcapOracle));
    _lockVaultFunction(VaultFunctions.TCAPORACLE);
  }

  function setCollateral(IVaultHandler _vault, ERC20 _collateral)
    public
    onlyOwner
    notLocked(VaultFunctions.COLLATERAL)
    validVault(_vault)
  {
    _vault.setCollateralContract(_collateral);
    _lockVaultFunction(VaultFunctions.COLLATERAL);
  }

  function setCollateralOracle(IVaultHandler _vault, address _collateralOracle)
    public
    onlyOwner
    notLocked(VaultFunctions.COLLATERALORACLE)
    validVault(_vault)
    validChainlinkOracle(_collateralOracle)
  {
    _vault.setCollateralPriceOracle(ChainlinkOracle(_collateralOracle));
    _lockVaultFunction(VaultFunctions.COLLATERALORACLE);
  }

  function setETHOracle(IVaultHandler _vault, address _ethOracles)
    public
    onlyOwner
    notLocked(VaultFunctions.ETHORACLE)
    validVault(_vault)
    validChainlinkOracle(_ethOracles)
  {
    _vault.setETHPriceOracle(ChainlinkOracle(_ethOracles));
    _lockVaultFunction(VaultFunctions.ETHORACLE);
  }

  function pauseVault(IVaultHandler _vault)
    public
    onlyOwner
    validVault(_vault)
  {
    _vault.pause();
  }

  function unpauseVault(IVaultHandler _vault)
    public
    onlyOwner
    validVault(_vault)
  {
    _vault.unpause();
  }

  function retrieveVaultFees(IVaultHandler _vault)
    public
    onlyOwner
    validVault(_vault)
  {
    _vault.retrieveFees();
  }

  function retrieveFees() public onlyOwner {
    uint256 amount = address(this).balance;
    payable(owner()).transfer(amount);
  }

  function enableTCAPCap(TCAP _tcap, bool _enable)
    public
    onlyOwner
    validTCAP(_tcap)
  {
    _tcap.enableCap(_enable);
  }

  function setTCAPCap(TCAP _tcap, uint256 _cap)
    public
    onlyOwner
    validTCAP(_tcap)
  {
    _tcap.setCap(_cap);
  }

  function addTCAPVault(TCAP _tcap, IVaultHandler _vault)
    public
    onlyOwner
    validTCAP(_tcap)
    validVault(_vault)
  {
    _tcap.addTokenHandler(address(_vault));
  }

  receive() external payable {}

  // // // 0xa9ccee51
  // function calcStoreInterfaceId() external view returns (bytes4) {
  //   TCAP i;
  //   bytes4 x = i.mint.selector ^
  //     i.burn.selector ^
  //     i.setCap.selector ^
  //     i.enableCap.selector ^
  //     i.transfer.selector ^
  //     i.transferFrom.selector ^
  //     i.approve.selector ^
  //     i.addTokenHandler.selector;
  //   console.logBytes4(x);
  // }
}
