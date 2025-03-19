// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICtx {
  // Events
  event MinterChanged(address minter, address newMinter);
  event DelegateChanged(
    address indexed delegator,
    address indexed fromDelegate,
    address indexed toDelegate
  );
  event DelegateVotesChanged(
    address indexed delegate,
    uint256 previousBalance,
    uint256 newBalance
  );
  event Transfer(address indexed from, address indexed to, uint256 amount);
  event Approval(
    address indexed owner,
    address indexed spender,
    uint256 amount
  );

  // View Functions
  function name() external view returns (string memory);

  function symbol() external view returns (string memory);

  function decimals() external view returns (uint8);

  function totalSupply() external view returns (uint256);

  function minter() external view returns (address);

  function mintingAllowedAfter() external view returns (uint256);

  function balanceOf(address account) external view returns (uint256);

  function allowance(address account, address spender)
    external
    view
    returns (uint256);

  function getCurrentVotes(address account) external view returns (uint96);

  function getPriorVotes(address account, uint256 blockNumber)
    external
    view
    returns (uint96);

  function delegates(address account) external view returns (address);

  function nonces(address account) external view returns (uint256);

  // State-Changing Functions
  function setMinter(address minter_) external;

  function mint(address dst, uint256 rawAmount) external;

  function transfer(address dst, uint256 rawAmount) external returns (bool);

  function transferFrom(
    address src,
    address dst,
    uint256 rawAmount
  ) external returns (bool);

  function approve(address spender, uint256 rawAmount) external returns (bool);

  function increaseAllowance(address spender, uint256 addedValue)
    external
    returns (bool);

  function decreaseAllowance(address spender, uint256 subtractedValue)
    external
    returns (bool);

  function delegate(address delegatee) external;

  function delegateBySig(
    address delegatee,
    uint256 nonce,
    uint256 expiry,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external;

  function permit(
    address owner,
    address spender,
    uint256 rawAmount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external;
}
