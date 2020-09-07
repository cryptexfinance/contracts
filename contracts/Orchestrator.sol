///Contract that manages the vaults and initilize their data
///Transfer ownership to orchestrator
//initialize values
// add vault to tcap
// handle timelocks and security

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/introspection/ERC165Checker.sol";
import "./IVaultHandler.sol";
import "./TCAP.sol";

//DEBUG
import "@nomiclabs/buidler/console.sol";

contract Orchestrator is Ownable {
  enum VaultFunctions {DIVISOR, RATIO, BURNFEE}
  mapping(IVaultHandler => bool) public initialized;
  mapping(VaultFunctions => uint256) public timelock;
  uint256 private constant _TIMELOCK = 3 days;

  bytes4 private constant _INTERFACE_ID_IVAULT = 0x0ba9e3a8;

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

  function initializeVault(
    IVaultHandler _vault,
    uint256 _divisor,
    uint256 _ratio,
    uint256 _burnFee,
    uint256 _liquidationPenalty,
    bool _whitelistEnabled,
    address _tcapOracle,
    TCAP _tcapAddress,
    address _collateralAddress,
    address _collateralOracle,
    address _ethOracle
  ) public onlyOwner validVault(_vault) {
    require(!initialized[_vault], "Contract already initialized");
    _vault.initialize(
      _divisor,
      _ratio,
      _burnFee,
      _liquidationPenalty,
      _whitelistEnabled,
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
  function lockVaultFunction(VaultFunctions _fn) public onlyOwner {
    timelock[_fn] = 0;
  }

  function setDivisor(IVaultHandler _vault, uint256 _divisor)
    public
    onlyOwner
    validVault(_vault)
    notLocked(VaultFunctions.DIVISOR)
  {
    _vault.setDivisor(_divisor);
  }

  // // 0x0ba9e3a8
  // function calcStoreInterfaceId() external view returns (bytes4) {
  //   IVaultHandler i;
  //   bytes4 x = i.initialize.selector ^
  //     i.setTCAPContract.selector ^
  //     i.setTCAPOracle.selector ^
  //     i.setCollateralContract.selector ^
  //     i.setCollateralPriceOracle.selector ^
  //     i.setETHPriceOracle.selector ^
  //     i.setDivisor.selector ^
  //     i.setRatio.selector ^
  //     i.setBurnFee.selector ^
  //     i.setLiquidationPenalty.selector ^
  //     i.enableWhitelist.selector;
  //   console.logBytes4(x);
  // }
}
