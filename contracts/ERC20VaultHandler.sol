// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "./IVaultHandler.sol";
import "./Orchestrator.sol";

/**
 * @title TCAP Vault
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP Vault and stake using a Collateral ERC20
 */
contract ERC20VaultHandler is IVaultHandler {
  constructor(
    Orchestrator orchestrator,
    uint256 _divisor,
    uint256 _ratio,
    uint256 _burnFee,
    uint256 _liquidationPenalty,
    address _tcapOracle,
    TCAP _tcapAddress,
    address _collateralAddress,
    address _collateralOracle,
    address _ethOracle
  )
    public
    IVaultHandler(
      orchestrator,
      _divisor,
      _ratio,
      _burnFee,
      _liquidationPenalty,
      _tcapOracle,
      _tcapAddress,
      _collateralAddress,
      _collateralOracle,
      _ethOracle
    )
  {}
}
