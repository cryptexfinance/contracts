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

//DEBUG
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
   * @param _amount uint amount to mint
   * @return collateral of the TCAPX Token
   */
  function minRequiredCollateral(uint256 _amount)
    public
    override
    view
    returns (uint256 collateral)
  {
    uint256 tcapPrice = TCAPXPrice();
    uint256 ethPrice = ethPriceOracle.price();
    console.logUint(ethPrice);
    //TODO: Fix this
    collateral = ((tcapPrice.mul(_amount).mul(ratio)).div(100 ether)).div(
      ethPrice
    );
    console.logUint(collateral);
  }
}
