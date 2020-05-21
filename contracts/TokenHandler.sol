// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";


/**
 * @title TCAP.X Token Handler
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP.X Token and stake
 */
contract TokenHandler is Ownable {
  /** @dev Logs all the calls of the functions. */
  event LogSetTCAPX(address indexed _owner, address _token);
  event LogSetOracle(address indexed _owner, address _oracle);
  event LogSetStablecoin(address indexed _owner, address _stablecoin);

  address public TCAPX;
  address public oracle;
  address public stablecoin;

  /**
   * @notice Sets the address of the TCAPX ERC20 contract
   * @param _TCAPX address
   * @dev Only owner can call it
   */
  function setTCAPX(address _TCAPX) public onlyOwner {
    TCAPX = _TCAPX;
    emit LogSetTCAPX(msg.sender, _TCAPX);
  }

  /**
   * @notice Sets the address of the oracle contract for the price feed
   * @param _oracle address
   * @dev Only owner can call it
   */
  function setOracle(address _oracle) public onlyOwner {
    oracle = _oracle;
    emit LogSetOracle(msg.sender, _oracle);
  }

  /**
   * @notice Sets the address of the stablecoin contract
   * @param _stablecoin address
   * @dev Only owner can call it
   */
  function setStablecoin(address _stablecoin) public onlyOwner {
    stablecoin = _stablecoin;
    emit LogSetStablecoin(msg.sender, _stablecoin);
  }
}
