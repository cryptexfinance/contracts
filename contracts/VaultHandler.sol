// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "./IVaultHandler.sol";
import "./Orchestrator.sol";

/**
 * @title TCAP ETH Vault
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP.X Vault and stake using ETH as Collateral
 */
contract VaultHandler is IVaultHandler {
  constructor(Orchestrator orchestrator) public IVaultHandler(orchestrator) {}
}
