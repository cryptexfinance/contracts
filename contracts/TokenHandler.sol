// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./mocks/Oracle.sol";


/**
 * @title TCAP.X Token Handler
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP.X Token and stake
 */
contract TokenHandler is Ownable, AccessControl {
  /** @dev Logs all the calls of the functions. */
  event LogSetTCAPX(address indexed _owner, address _token);
  event LogSetOracle(address indexed _owner, Oracle _oracle);
  event LogSetStablecoin(address indexed _owner, address _stablecoin);
  event LogSetDivisor(address indexed _owner, uint256 _divisor);

  using SafeMath for uint256;
  bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");

  address public TCAPX;
  Oracle public oracle;
  address public stablecoin;
  uint256 public divisor;
  mapping(address => uint256) public vaults;

  constructor() public {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

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
  function setOracle(Oracle _oracle) public onlyOwner {
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

  /**
   * @notice Sets the divisor amount for token price calculation
   * @param _divisor uint
   * @dev Only owner can call it
   */
  function setDivisor(uint256 _divisor) public onlyOwner {
    divisor = _divisor;
    emit LogSetDivisor(msg.sender, _divisor);
  }

  /**
   * @notice Add the investor role to an address
   * @param _investor address
   * @dev Only owner can call it
   */
  function addInvestor(address _investor) public onlyOwner {
    grantRole(INVESTOR_ROLE, _investor);
  }

  /**
   * @notice Remove the investor role from an address
   * @param _investor address
   * @dev Only owner can call it
   */
  function removeInvestor(address _investor) public onlyOwner {
    revokeRole(INVESTOR_ROLE, _investor);
  }

  /**
   * @notice Creates a Vault
   * @dev Only whitelisted can call it
   */
  function createVault() public {}

  /**
   * @notice Returns the price of the TCAPX token
   * @dev TCAPX token is 18 decimals
   * @return price of the TCAPX Token
   */
  function TCAPXPrice() public view returns (uint256 price) {
    uint256 totalMarketPrice = oracle.price();
    price = totalMarketPrice.div(divisor);
  }
}
