// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/ERC20VaultHandler.sol";
import "../contracts/TCAP.sol";

contract Liquidate is Script {
  function run() public {
    vm.startBroadcast();
    // // Liquidate
    uint256 vaultId = 1;
    IVaultHandler vault = IVaultHandler(0xA5b3Bb6e1f206624B3B8CE0c6A0f7614fd35Fa03);
    TCAP tcap = TCAP(0x16c52CeeCE2ed57dAd87319D91B5e3637d50aFa4);
    console.log("ratio", vault.ratio());
    console.log("vault ratio", vault.getVaultRatio(vaultId));
    console.log("deployer", msg.sender);
    require(vault.ratio() > vault.getVaultRatio(vaultId) && vault.getVaultRatio(vaultId) != 0 , "not liquidable vault above");
    require(tcap.balanceOf(msg.sender)> vault.requiredLiquidationTCAP(vaultId));
    vault.liquidateVault(vaultId, tcap.balanceOf(msg.sender));
  }
}
