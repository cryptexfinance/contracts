// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;
import "./ITokenHandler.sol";

//Debug
import "@nomiclabs/buidler/console.sol";


/**
 * @title TCAP.X Token Handler
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP.X Token and stake
 */
contract InterestTokenHandler is ITokenHandler {
  /**
   * @notice Sets the address of the collateral contract
   * @param _collateralContract address
   * @dev Only owner can call it
   */
  function setStakingContract(ERC20 _collateralContract) public onlyOwner {
    collateralContract = _collateralContract;
    emit LogSetCollateralContract(msg.sender, _collateralContract);
  }

  /**
   * @notice Adds collateral to vault
   * @dev Only whitelisted can call it
   * @param _amount of collateral to add
   */
  function addCollateral(uint256 _amount)
    public
    override
    onlyInvestor
    nonReentrant
    vaultExists
  {
    //TODO: stake money
    collateralContract.transferFrom(msg.sender, address(this), _amount);
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    vault.Collateral = vault.Collateral.add(_amount);
    emit LogAddCollateral(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Removes not used collateral from collateral
   * @param _amount of collateral to add
   */
  function removeCollateral(uint256 _amount)
    public
    override
    nonReentrant
    vaultExists
  {
    //TODO: remove stake
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    require(
      vault.Collateral >= _amount,
      "Transaction reverted with Retrieve amount higher than collateral"
    );
    vault.Collateral = vault.Collateral.sub(_amount);
    collateralContract.transfer(msg.sender, _amount);
    emit LogRemoveCollateral(msg.sender, vault.Id, _amount);
  }
}
