// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "./IVaultHandler.sol";
import "./Orchestrator.sol";

/**
 * @title TCAP Vault
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP Vault and stake using a Collateral ERC20
 */
contract VaultHandler is IVaultHandler {
  constructor(Orchestrator orchestrator) public IVaultHandler(orchestrator) {}
}
