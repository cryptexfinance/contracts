// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


/**
 * @title TCAP.X
 * @author Cristian Espinoza
 * @notice ERC20 token on the Ethereum Blockchain that provides total exposure to the cryptocurrency sector
 */
contract TCAPX is ERC20 {
  constructor(
    string memory _name,
    string memory _symbol,
    uint256 _decimals
  ) public ERC20(_name, _symbol) {}
}
