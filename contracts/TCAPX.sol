// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


/**
 * @title TCAP.X
 * @author Cristian Espinoza
 * @notice ERC20 token on the Ethereum Blockchain that provides total exposure to the cryptocurrency sector
 */
contract TCAPX is ERC20, Ownable {
  /** @dev Logs all the calls of the functions. */
  event LogAddTokenHandler(address indexed _owner, address _tokenHandler);

  mapping(address => bool) public tokenHandlers;

  constructor(
    string memory _name,
    string memory _symbol,
    uint256 _decimals
  ) public ERC20(_name, _symbol) {}

  /** @notice Throws if called by any account other than the handler. */
  modifier onlyHandler() {
    require(tokenHandlers[msg.sender], "Caller is not the handler");
    _;
  }

  /**
   * @notice Sets the address of the handler contract
   * @param _handler address of the receiver of tokens
   * @dev Only owner can call it
   */
  function addTokenHandler(address _handler) public onlyOwner {
    tokenHandlers[_handler] = true;
    emit LogAddTokenHandler(msg.sender, _handler);
  }

  /**
   * @notice Mints TCAPX Tokens
   * @param _account address of the receiver of tokens
   * @param _amount uint of tokens to mint
   * @dev Only handler can call it
   */
  function mint(address _account, uint256 _amount) public onlyHandler {
    _mint(_account, _amount);
  }

  /**
   * @notice Burns TCAPX Tokens
   * @param _account address of the receiver of tokens
   * @param _amount uint of tokens to burn
   * @dev Only handler can call it
   */
  function burn(address _account, uint256 _amount) public onlyHandler {
    _burn(_account, _amount);
  }
}
