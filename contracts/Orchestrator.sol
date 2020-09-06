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

contract Orchestrator is Ownable {
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
  }
}
