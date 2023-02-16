// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "./IVaultHandler.sol";
import "./Orchestrator.sol";

/**
 * @title ERC-20 Index Token Vault
 * @author Cryptex.finance
 * @notice Contract in charge of handling the Index Token Vault and stake using a Collateral ERC20
 */
contract ERC20VaultHandler is IVaultHandler {
  /**
   * @notice Constructor
   * @param _orchestrator address
   * @param _divisor uint256
   * @param _ratio uint256
   * @param _burnFee uint256
   * @param _mintFee uint256
   * @param _liquidationPenalty uint256
   * @param _indexOracle address
   * @param _indexAddress address
   * @param _collateralAddress address
   * @param _collateralOracle address
   * @param _ethOracle address
   * @param _treasury address
   * @param _minimumMint uint256
   */
  constructor(
    Orchestrator _orchestrator,
    uint256 _divisor,
    uint256 _ratio,
    uint256 _burnFee,
    uint256 _mintFee,
    uint256 _liquidationPenalty,
    address _indexOracle,
    IndexToken _indexAddress,
    address _collateralAddress,
    address _collateralOracle,
    address _ethOracle,
    address _treasury,
    uint256 _minimumMint
  )
    IVaultHandler(
      _orchestrator,
      _divisor,
      _ratio,
      _burnFee,
      _mintFee,
      _liquidationPenalty,
      _indexOracle,
      _indexAddress,
      _collateralAddress,
      _collateralOracle,
      _ethOracle,
      _treasury,
      _minimumMint
    )
  {}
}
