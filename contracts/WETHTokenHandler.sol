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
import "./mocks/PriceFeed.sol";

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
  event LogSetETHPriceOracle(address indexed _owner, PriceFeed _priceOracle);

  PriceFeed public ethPriceOracle;

  /**
   * @notice Sets the address of the oracle contract for the price feed
   * @param _oracle address
   * @dev Only owner can call it
   */
  function setETHPriceOracle(PriceFeed _oracle) public virtual onlyOwner {
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
    bytes32 ethPriceBytes = ethPriceOracle.read();
    uint256 ethPrice = bytesToUint(ethPriceBytes);
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
      bytes32 ethPriceBytes = ethPriceOracle.read();
      uint256 ethPrice = bytesToUint(ethPriceBytes);
      currentRatio = (
        (ethPrice.mul(vault.Collateral.mul(100))).div(
          vault.Debt.mul(TCAPXPrice())
        )
      );
    }
  }

  /**
   * @notice Calculates the burn fee for a certain amount
   * @param _amount uint to calculate from
   * @dev it's divided by 100 to cancel the wei value of the tcapx price
   * @return fee
   */
  function getFee(uint256 _amount) public override view returns (uint256 fee) {
    bytes32 ethPriceBytes = ethPriceOracle.read();
    uint256 ethPrice = bytesToUint(ethPriceBytes);
    fee = (TCAPXPrice().mul(_amount).mul(burnFee)).div(100).div(ethPrice);
  }

  function bytesToUint(bytes32 b) internal pure returns (uint256) {
    uint256 number;
    for (uint256 i = 0; i < b.length; i++) {
      number =
        number +
        uint256(uint8((b[i]))) *
        (2**(8 * (b.length - (i + 1))));
    }
    return number;
  }
}
