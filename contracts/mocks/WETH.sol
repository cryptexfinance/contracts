// SPDX-License-Identifier: UNLICENSED
/** @notice this contract is for tests only */

pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract WETH is ERC20 {
  constructor() public ERC20("Mockup WETH", "mWETH") {}

  function mint(address _account, uint256 _amount) public {
    _mint(_account, _amount);
  }

  function burn(address _account, uint256 _amount) public {
    _burn(_account, _amount);
  }
}
