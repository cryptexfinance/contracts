// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./mocks/Oracle.sol";


/**
 * @title TCAP.X Token Handler
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP.X Token and stake
 */
contract TokenHandler is Ownable, AccessControl, ReentrancyGuard {
  /** @dev Logs all the calls of the functions. */
  event LogSetTCAPX(address indexed _owner, ERC20 _token);
  event LogSetOracle(address indexed _owner, Oracle _oracle);
  event LogSetStablecoin(address indexed _owner, ERC20 _stablecoin);
  event LogSetDivisor(address indexed _owner, uint256 _divisor);
  event LogCreateVault(address indexed _owner, uint256 indexed _id);
  event LogAddCollateral(
    address indexed _owner,
    uint256 indexed _id,
    uint256 _amount
  );
  event LogRemoveCollateral(
    address indexed _owner,
    uint256 indexed _id,
    uint256 _amount
  );

  using SafeMath for uint256;
  using Counters for Counters.Counter;

  Counters.Counter counter;

  bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");

  struct Vault {
    uint256 Id;
    uint256 Collateral;
    address Owner;
  }

  ERC20 public TCAPX;
  Oracle public oracle;
  ERC20 public stablecoin;
  uint256 public divisor;
  mapping(address => uint256) public vaultToUser;
  mapping(uint256 => Vault) public vaults;

  /** @notice Throws if called by any account other than the investor. */
  modifier onlyInvestor() {
    require(hasRole(INVESTOR_ROLE, msg.sender), "Caller is not investor");
    _;
  }

  /** @dev counter starts in one as 0 is reserved for empty objects */
  constructor() public {
    counter.increment();
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  /**
   * @notice Sets the address of the TCAPX ERC20 contract
   * @param _TCAPX address
   * @dev Only owner can call it
   */
  function setTCAPX(ERC20 _TCAPX) public onlyOwner {
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
  function setStablecoin(ERC20 _stablecoin) public onlyOwner {
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
  function createVault() public onlyInvestor {
    require(vaultToUser[msg.sender] == 0, "Vault already created");
    uint256 id = counter.current();
    vaultToUser[msg.sender] = id;
    Vault memory vault = Vault(id, 0, msg.sender);
    vaults[id] = vault;
    counter.increment();
    emit LogCreateVault(msg.sender, id);
  }

  /**
   * @notice Adds Stablecoin to vault
   * @dev Only whitelisted can call it
   * @param _amount of stablecoin to add
   */
  function addCollateral(uint256 _amount) public onlyInvestor nonReentrant {
    stablecoin.transferFrom(msg.sender, address(this), _amount);
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    vault.Collateral = vault.Collateral.add(_amount);
    emit LogAddCollateral(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Removes not used stablecoin from collateral
   * @param _amount of stablecoin to add
   */
  function removeCollateral(uint256 _amount) public nonReentrant {
    Vault storage vault = vaults[vaultToUser[msg.sender]];
    require(
      vault.Collateral >= _amount,
      "Transaction reverted with Retrieve amount higher than collateral"
    );
    vault.Collateral = vault.Collateral.sub(_amount);
    stablecoin.transfer(msg.sender, _amount);
    emit LogRemoveCollateral(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Returns the price of the TCAPX token
   * @dev TCAPX token is 18 decimals
   * @return price of the TCAPX Token
   */
  function TCAPXPrice() public view returns (uint256 price) {
    uint256 totalMarketPrice = oracle.price();
    price = totalMarketPrice.div(divisor);
  }

  /**
   * @notice Returns the vault object
   * @param _id Id of the vault
   * @return id the vault
   * @return collateral added
   * @return owner of the vault
   */
  function getVault(uint256 _id)
    public
    view
    returns (
      uint256 id,
      uint256 collateral,
      address owner
    )
  {
    Vault memory vault = vaults[_id];
    return (vault.Id, vault.Collateral, vault.Owner);
  }
}
