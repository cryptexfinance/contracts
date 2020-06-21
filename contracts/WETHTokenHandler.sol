// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./mocks/Oracle.sol";
import "./TCAPX.sol";

import "./ITokenHandler.sol";

import "@nomiclabs/buidler/console.sol";


/**
 * @title TCAP.X ETH Vault
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP.X Token and stake using ETH as Collateral
 */
contract WETHTokenHandler is
  Ownable,
  AccessControl,
  ReentrancyGuard,
  ITokenHandler
{
  /** @dev Logs all the calls of the functions. */
  event LogSetETHPriceOracle(address indexed _owner, Oracle _priceOracle);

  Oracle public ethPriceOracle;

  /**
   * @notice Sets the address of the oracle contract for the price feed
   * @param _oracle address
   * @dev Only owner can call it
   */
  function setETHPriceOracle(Oracle _oracle) public virtual onlyOwner {
    ethPriceOracle = _oracle;
    emit LogSetETHPriceOracle(msg.sender, _oracle);
  }

  /**
   * @notice Returns the minimal required collateral to mint TCAPX token
   * @dev TCAPX token is 18 decimals
   * @dev Is only divided by 100 as eth price comes in wei to cancel the additional 0
   * @param _amount uint amount to mint
   * @return collateral of the TCAPX Token
   */
  function requiredCollateral(uint256 _amount)
    public
    override
    view
    returns (uint256 collateral)
  {
    uint256 tcapPrice = TCAPXPrice();
    uint256 ethPrice = ethPriceOracle.price();
    collateral = ((tcapPrice.mul(_amount).mul(ratio)).div(100)).div(ethPrice);
  }

  /**
   * @notice Returns the current collateralization ratio
   * @dev is multiplied by 100 to cancel the wei value of the tcapx price
   * @dev ratio is not 100% accurate as decimals precisions is complicated
   * @param _vaultId uint of the vault
   * @return currentRatio
   */
  function getVaultRatio(uint256 _vaultId)
    public
    override
    view
    returns (uint256 currentRatio)
  {
    Vault memory vault = vaults[_vaultId];
    if (vault.Id == 0 || vault.Debt == 0) {
      currentRatio = 0;
    } else {
      uint256 ethPrice = ethPriceOracle.price();
      currentRatio = (
        (ethPrice.mul(vault.Collateral.mul(100))).div(
          vault.Debt.mul(TCAPXPrice())
        )
      );
    }
  }
}
