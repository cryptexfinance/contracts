// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "./IVaultHandler.sol";
import "./Orchestrator.sol";
import "./IWETH.sol";

//TODO Remove
import "@nomiclabs/buidler/console.sol";

/**
 * @title TCAP Vault
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP Vault and stake using a Collateral ERC20
 */
contract ETHVaultHandler is IVaultHandler {
  constructor(Orchestrator orchestrator) public IVaultHandler(orchestrator) {}

  /**
   * @notice Adds collateral to vault
   */
  function addCollateralETH()
    public
    payable
    nonReentrant
    vaultExists
    whenNotPaused
  {
    console.log("yo");
    IWETH(address(collateralContract)).deposit{value: msg.value}();
    // assert(IWETH(WETH).transfer(address(this), amountETH));
    collateralContract.transferFrom(msg.sender, address(this), msg.value);
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    vault.Collateral = vault.Collateral.add(msg.value);
    console.log("bye");
    emit LogAddCollateral(msg.sender, vault.Id, msg.value);
  }

  /**
   * @notice Removes not used collateral from collateral
   * @param _amount of collateral to add
   */
  function removeCollateralETH(uint256 _amount)
    public
    nonReentrant
    vaultExists
    whenNotPaused
  {
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    uint256 currentRatio = getVaultRatio(vault.Id);
    require(
      vault.Collateral >= _amount,
      "Transaction reverted with Retrieve amount higher than collateral"
    );
    vault.Collateral = vault.Collateral.sub(_amount);
    if (currentRatio != 0) {
      require(
        getVaultRatio(vault.Id) >= ratio,
        "Collateral below min required ratio"
      );
    }

    IWETH(address(collateralContract)).withdraw(_amount);
    safeTransferETH(msg.sender, _amount);
    emit LogRemoveCollateral(msg.sender, vault.Id, _amount);
  }

  function safeTransferETH(address to, uint256 value) internal {
    (bool success, ) = to.call{value: value}(new bytes(0));
    require(success, "TransferHelper: ETH_TRANSFER_FAILED");
  }
}
