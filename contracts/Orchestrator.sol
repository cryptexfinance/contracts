///Contract that manages the vaults and initilize their data
///Transfer ownership to orchestrator
//initialize values
// add vault to tcap
// handle timelocks and security

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IVaultHandler.sol";
import "./TCAP.sol";
import "@openzeppelin/contracts/introspection/ERC165Checker.sol";

//DEBUG
import "@nomiclabs/buidler/console.sol";

contract Orchestrator is Ownable {
  mapping(IVaultHandler => bool) public initialized;

  function initializeVault(
    IVaultHandler vault,
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
  ) public onlyOwner {
    require(!initialized[vault], "Contract already initialized");
    require(
      ERC165Checker.supportsInterface(address(vault), 0x0ba9e3a8),
      "Not a valid vault"
    );
    vault.initialize(
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
    initialized[vault] = true;
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
