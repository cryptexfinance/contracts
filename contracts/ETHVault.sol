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


/**
 * @title TCAP.X ETH Vault
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP.X Token and stake using ETH as Collateral
 */
contract ETHVault is Ownable, AccessControl, ReentrancyGuard {
  /** @dev Logs all the calls of the functions. */
  event LogSetTCAPXContract(address indexed _owner, TCAPX _token);
  event LogSetTcapOracle(address indexed _owner, Oracle _tcapOracle);
  event LogSetPriceOracle(address indexed _owner, Oracle _priceOracle);
  event LogSetCollateralContract(
    address indexed _owner,
    ERC20 _collateralContract
  );
  event LogSetDivisor(address indexed _owner, uint256 _divisor);
  event LogSetRatio(address indexed _owner, uint256 _ratio);
  event LogCreateVault(address indexed _owner, uint256 indexed _id);
  // event LogAddCollateral(
  //   address indexed _owner,
  //   uint256 indexed _id,
  //   uint256 _amount
  // );
  // event LogRemoveCollateral(
  //   address indexed _owner,
  //   uint256 indexed _id,
  //   uint256 _amount
  // );
  // event LogMint(address indexed _owner, uint256 indexed _id, uint256 _amount);
  // event LogBurn(address indexed _owner, uint256 indexed _id, uint256 _amount);

  using SafeMath for uint256;
  using Counters for Counters.Counter;

  Counters.Counter counter;

  bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");

  struct Vault {
    uint256 Id;
    uint256 Collateral;
    address Owner;
    uint256 Debt;
  }

  TCAPX public TCAPXToken;
  Oracle public tcapOracle;
  Oracle public priceOracle;
  ERC20 public collateralContract;
  uint256 public divisor;
  uint256 public ratio;
  mapping(address => uint256) public vaultToUser;
  mapping(uint256 => Vault) public vaults;

  /** @notice Throws if called by any account other than the investor. */
  modifier onlyInvestor() {
    require(hasRole(INVESTOR_ROLE, msg.sender), "Caller is not investor");
    _;
  }

  /** @notice Throws if vault hasn't been created. */
  modifier vaultExists() {
    require(vaultToUser[msg.sender] != 0, "No Vault created");
    _;
  }

  /** @dev counter starts in one as 0 is reserved for empty objects */
  constructor() public {
    counter.increment();
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  /**
   * @notice Sets the address of the TCAPX ERC20 contract
   * @param _TCAPXToken address
   * @dev Only owner can call it
   */
  function setTCAPXContract(TCAPX _TCAPXToken) public virtual onlyOwner {
    TCAPXToken = _TCAPXToken;
    emit LogSetTCAPXContract(msg.sender, _TCAPXToken);
  }

  /**
   * @notice Sets the address of the oracle contract for the price feed
   * @param _oracle address
   * @dev Only owner can call it
   */
  function setTcapOracle(Oracle _oracle) public virtual onlyOwner {
    tcapOracle = _oracle;
    emit LogSetTcapOracle(msg.sender, _oracle);
  }

  /**
   * @notice Sets the address of the oracle contract for the price feed
   * @param _oracle address
   * @dev Only owner can call it
   */
  function setPriceOracle(Oracle _oracle) public virtual onlyOwner {
    priceOracle = _oracle;
    emit LogSetPriceOracle(msg.sender, _oracle);
  }

  /**
   * @notice Sets the divisor amount for token price calculation
   * @param _divisor uint
   * @dev Only owner can call it
   */
  function setDivisor(uint256 _divisor) public virtual onlyOwner {
    divisor = _divisor;
    emit LogSetDivisor(msg.sender, _divisor);
  }

  /**
   * @notice Sets the collateral ratio needed to mint tokens
   * @param _ratio uint
   * @dev Only owner can call it
   */
  function setRatio(uint256 _ratio) public virtual onlyOwner {
    ratio = _ratio;
    emit LogSetRatio(msg.sender, _ratio);
  }

  /**
   * @notice Add the investor role to an address
   * @param _investor address
   * @dev Only owner can call it
   */
  function addInvestor(address _investor) public virtual onlyOwner {
    grantRole(INVESTOR_ROLE, _investor);
  }

  /**
   * @notice Remove the investor role from an address
   * @param _investor address
   * @dev Only owner can call it
   */
  function removeInvestor(address _investor) public virtual onlyOwner {
    revokeRole(INVESTOR_ROLE, _investor);
  }

  /**
   * @notice Creates a Vault
   * @dev Only whitelisted can call it
   */
  function createVault() public virtual onlyInvestor {
    require(vaultToUser[msg.sender] == 0, "Vault already created");
    uint256 id = counter.current();
    vaultToUser[msg.sender] = id;
    Vault memory vault = Vault(id, 0, msg.sender, 0);
    vaults[id] = vault;
    counter.increment();
    emit LogCreateVault(msg.sender, id);
  }

  /**
   * @notice Returns the price of the TCAPX token
   * @dev TCAPX token is 18 decimals
   * @return price of the TCAPX Token
   */
  function TCAPXPrice() public virtual view returns (uint256 price) {
    uint256 totalMarketPrice = tcapOracle.price();
    price = totalMarketPrice.div(divisor);
  }

  /**
   * @notice Returns the vault object
   * @param _id Id of the vault
   * @return id the vault
   * @return collateral added
   * @return owner of the vault
   * @return debt of the vault
   */
  function getVault(uint256 _id)
    public
    virtual
    view
    returns (
      uint256,
      uint256,
      address,
      uint256
    )
  {
    Vault memory vault = vaults[_id];
    return (vault.Id, vault.Collateral, vault.Owner, vault.Debt);
  }
}
