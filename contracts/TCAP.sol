// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./Orchestrator.sol";

/**
 * @title Total Market Cap Token
 * @author Cristian Espinoza
 * @notice ERC20 token on the Ethereum Blockchain that provides total exposure to the cryptocurrency sector.
 */
contract TCAP is ERC20, Ownable, IERC165 {
  using SafeMath for uint256;

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
   * approve.selector => 0xa9ccee51
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

  /** @notice Throws if called by any account other than a handler. */
  modifier onlyHandler() {
    require(
      tokenHandlers[msg.sender],
      "TCAP::onlyHandler: caller is not a handler"
    );
    _;
  }

  /**
   * @notice Sets the address of a handler contract
   * @param _handler address of a contract with permissions to mint and burn tokens
   * @dev Only owner can call it
   */
  function addTokenHandler(address _handler) external onlyOwner {
    tokenHandlers[_handler] = true;
    emit LogAddTokenHandler(msg.sender, _handler);
  }

  /**
   * @notice Mints TCAP Tokens
   * @param _account address of the receiver of tokens
   * @param _amount uint of tokens to mint
   * @dev Only handler can call it
   */
  function mint(address _account, uint256 _amount) external onlyHandler {
    _mint(_account, _amount);
  }

  /**
   * @notice Burns TCAP Tokens
   * @param _account address of the account which is burning tokens.
   * @param _amount uint of tokens to burn
   * @dev Only handler can call it
   */
  function burn(address _account, uint256 _amount) external onlyHandler {
    _burn(_account, _amount);
  }

  /**
   * @notice Sets the maximum capacity of the token.
   * @param _cap value
   * @dev When capEnabled is true, mint is not allowed to issue tokens that would increase the
   * total supply above the specified capacity.
   * @dev Only owner can call it
   */
  function setCap(uint256 _cap) external onlyOwner {
    cap = _cap;
    emit LogSetCap(msg.sender, _cap);
  }

  /**
   * @notice Enables or Disables the Token Cap.
   * @param _enable value
   * @dev When capEnabled is true, minting will not be allowed above the max capacity. It can exist a supply above the cap, but it prevents minting above the cap.
   * @dev Only owner can call it
   */
  function enableCap(bool _enable) external onlyOwner {
    capEnabled = _enable;
    emit LogEnableCap(msg.sender, _enable);
  }

  /**
   * @dev See {ERC20-_beforeTokenTransfer}.
   * @notice minted tokens must not cause the total supply to go over the cap.
   * @dev Reverts if the to address is equal to token address
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override {
    super._beforeTokenTransfer(from, to, amount);

    require(
      to != address(this),
      "TCAP::transfer: can't transfer to TCAP contract"
    );

    if (from == address(0) && capEnabled) {
      // When minting tokens
      require(
        totalSupply().add(amount) <= cap,
        "TCAP::Transfer: TCAP cap exceeded"
      );
    }
  }

  /**
   * @notice ERC165 Standard for support of interfaces
   * @param interfaceId bytes of interface
   * @return bool
   */
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
