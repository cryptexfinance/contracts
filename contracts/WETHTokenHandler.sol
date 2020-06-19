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
  event LogSetTcapOracle(address indexed _owner, Oracle _tcapOracle);
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
}
