// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";
import "./Orchestrator.sol";

/**
 * @title Total Market Cap Token
 * @author Cristian Espinoza
 * @notice ERC20 token on the Ethereum Blockchain that provides total exposure to the cryptocurrency sector
 */
contract TCAP is ERC20, Ownable, IERC165 {
  /** @dev Logs all the calls of the functions. */
  event LogAddTokenHandler(address indexed _owner, address _tokenHandler);
  event LogSetCap(address indexed _owner, uint256 _amount);
  event LogEnableCap(address indexed _owner, bool _enable);

  uint256 public cap;
  bool public capEnabled = false;
  mapping(address => bool) public tokenHandlers;

  /*
   * mint.selector ^
   * burn.selector ^
   * setCap.selector ^
   * enableCap.selector ^
   * transfer.selector ^
   * transferFrom.selector ^
   * approve.selector =>  0xa9ccee51
   */
  bytes4 private constant _INTERFACE_ID_TCAP = 0xa9ccee51;

  /*
   * bytes4(keccak256('supportsInterface(bytes4)')) == 0x01ffc9a7
   */
  bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;

  constructor(
    string memory _name,
    string memory _symbol,
    uint256 _cap,
    Orchestrator _orchestrator
  ) public ERC20(_name, _symbol) {
    cap = _cap;
    transferOwnership(address(_orchestrator));
  }

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
   * @notice Mints TCAP Tokens
   * @param _account address of the receiver of tokens
   * @param _amount uint of tokens to mint
   * @dev Only handler can call it
   */
  function mint(address _account, uint256 _amount) public onlyHandler {
    _mint(_account, _amount);
  }

  /**
   * @notice Burns TCAP Tokens
   * @param _account address of the receiver of tokens
   * @param _amount uint of tokens to burn
   * @dev Only handler can call it
   */
  function burn(address _account, uint256 _amount) public onlyHandler {
    _burn(_account, _amount);
  }

  /**
   * @notice Sets the maximum cap of the token
   * @param _cap value
   * @dev Only owner can call it
   */
  function setCap(uint256 _cap) public onlyOwner {
    cap = _cap;
    emit LogSetCap(msg.sender, _cap);
  }

  /**
   * @notice Enables or Disables the Token Cap
   * @param _enable value
   * @dev Only owner can call it
   */
  function enableCap(bool _enable) public onlyOwner {
    capEnabled = _enable;
    emit LogEnableCap(msg.sender, _enable);
  }

  /**
   * @dev See {ERC20-_beforeTokenTransfer}.
   * @notice minted tokens must not cause the total supply to go over the cap.
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override {
    super._beforeTokenTransfer(from, to, amount);

    if (from == address(0) && capEnabled) {
      // When minting tokens
      require(totalSupply().add(amount) <= cap, "ERC20: cap exceeded");
    }
  }

  //Supports interface
  function supportsInterface(bytes4 interfaceId)
    external
    override
    view
    returns (bool)
  {
    return (interfaceId == _INTERFACE_ID_TCAP ||
      interfaceId == _INTERFACE_ID_ERC165);
  }
}
