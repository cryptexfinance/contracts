// SPDX-License-Identifier: MIT
pragma solidity 0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";
import "./TCAP.sol";
import "./Orchestrator.sol";
import "./oracles/ChainlinkOracle.sol";

/**
 * @title TCAP Vault Handler
 * @author Cristian Espinoza
 * @notice Contract in charge of handling the TCAP Token and stake
 */
abstract contract IVaultHandler is
  Ownable,
  AccessControl,
  ReentrancyGuard,
  Pausable,
  IERC165
{
  /** @dev Logs all the calls of the functions. */
  event LogInitializeVault(
    uint256 _divisor,
    uint256 _ratio,
    uint256 _burnFee,
    uint256 _liquidationPenalty,
    address _tcapOracle,
    TCAP _tcapAddress,
    address _collateralAddress,
    address _collateralOracle,
    address _ethOracle
  );
  event LogSetRatio(address indexed _owner, uint256 _ratio);
  event LogSetBurnFee(address indexed _owner, uint256 _burnFee);
  event LogSetLiquidationPenalty(
    address indexed _owner,
    uint256 _liquidationPenalty
  );
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
  event LogMint(address indexed _owner, uint256 indexed _id, uint256 _amount);
  event LogBurn(address indexed _owner, uint256 indexed _id, uint256 _amount);
  event LogLiquidateVault(
    uint256 indexed _vaultId,
    address indexed _liquidator,
    uint256 _liquidationCollateral,
    uint256 _reward
  );
  event LogRetrieveFees(address indexed _owner, uint256 _amount);

  /** @dev Open Zeppelin libraries */
  using SafeMath for uint256;
  using SafeCast for int256;
  using Counters for Counters.Counter;

  /** @dev vault id counter */
  Counters.Counter public counter;

  /**
   * @notice There is one vault per user. it saves an unique identifier,
   * the current collateral provided by the owner, the debt and the owner address
   */
  struct Vault {
    uint256 Id;
    uint256 Collateral;
    uint256 Debt;
    address Owner;
  }
  /** @dev TCAP Token Address */
  TCAP public TCAPToken;
  /** @dev Total Market Cap Oracle */
  ChainlinkOracle public tcapOracle;
  /** @dev Collateral Token Address*/
  IERC20 public collateralContract;
  /** @dev Collateral Oracle Address*/
  ChainlinkOracle public collateralPriceOracle;
  /** @dev Collateral Oracle Address*/
  ChainlinkOracle public ETHPriceOracle;

  /** @dev divisor value used with the total market cap, just like the S&P 500 or any major financial index would to define the final tcap token price */
  uint256 public divisor;
  /** @dev Liquidation Ratio */
  uint256 public ratio;
  /** @dev Fee charged when burning TCAP Tokens */
  uint256 public burnFee;
  /** @dev Penalty charged when an account gets liquidated */
  uint256 public liquidationPenalty;
  /** @dev Owner to Vault Id */
  mapping(address => uint256) public userToVault;
  /** @dev Id To Vault */
  mapping(uint256 => Vault) public vaults;

  /** @dev value used to multiply chainlink oracle for handling decimals */
  uint256 public constant oracleDigits = 10000000000;

  /** @notice Throws if vault hasn't been created. */
  modifier vaultExists() {
    require(
      userToVault[msg.sender] != 0,
      "VaultHandler::vaultExists: no vault created"
    );
    _;
  }

  /** @notice Throws if value is 0. */
  modifier notZero(uint256 _value) {
    require(_value != 0, "VaultHandler::notZero: value can't be 0");
    _;
  }

  /**
   * @dev the computed interface ID according to ERC-165. The interface ID is a XOR of interface method selectors.
   * initialize.selector ^
   * setRatio.selector ^
   * setBurnFee.selector ^
   * setLiquidationPenalty.selector ^
   * pause.selector ^
   * unpause.selector =>  0x9e75ab0c
   */
  bytes4 private constant _INTERFACE_ID_IVAULT = 0x9e75ab0c;

  /* bytes4(keccak256('supportsInterface(bytes4)')) == 0x01ffc9a7 */
  bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;

  /** @dev counter starts in one as 0 is reserved for empty objects */
  /**
   * @notice Allows the orchestrator to initialize the contract
   * @param _orchestrator address
   * @param _divisor uint256
   * @param _ratio uint256
   * @param _burnFee uint256
   * @param _liquidationPenalty uint256
   * @param _tcapOracle address
   * @param _tcapAddress address
   * @param _collateralAddress address
   * @param _collateralOracle address
   * @param _ethOracle address
   */
  constructor(
    Orchestrator _orchestrator,
    uint256 _divisor,
    uint256 _ratio,
    uint256 _burnFee,
    uint256 _liquidationPenalty,
    address _tcapOracle,
    TCAP _tcapAddress,
    address _collateralAddress,
    address _collateralOracle,
    address _ethOracle
  ) public {
    require(
      _liquidationPenalty.add(100) < _ratio,
      "VaultHandler::initialize: liquidation penalty too high"
    );
    divisor = _divisor;
    ratio = _ratio;
    burnFee = _burnFee;
    liquidationPenalty = _liquidationPenalty;
    tcapOracle = ChainlinkOracle(_tcapOracle);
    collateralContract = IERC20(_collateralAddress);
    collateralPriceOracle = ChainlinkOracle(_collateralOracle);
    ETHPriceOracle = ChainlinkOracle(_ethOracle);
    TCAPToken = _tcapAddress;
    counter.increment();
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    transferOwnership(address(_orchestrator));
  }

  /**
   * @notice Sets the collateral ratio needed to mint tokens
   * @param _ratio uint
   * @dev Only owner can call it
   */
  function setRatio(uint256 _ratio) external virtual onlyOwner {
    ratio = _ratio;
    emit LogSetRatio(msg.sender, _ratio);
  }

  /**
   * @notice Sets the burn fee percentage an user pays when burning tcap tokens
   * @param _burnFee uint
   * @dev Only owner can call it
   */
  function setBurnFee(uint256 _burnFee) external virtual onlyOwner {
    burnFee = _burnFee;
    emit LogSetBurnFee(msg.sender, _burnFee);
  }

  /**
   * @notice Sets the liquidation penalty % charged on liquidation
   * @param _liquidationPenalty uint
   * @dev Only owner can call it
   */
  function setLiquidationPenalty(uint256 _liquidationPenalty)
    external
    virtual
    onlyOwner
  {
    require(
      _liquidationPenalty.add(100) < ratio,
      "VaultHandler::setLiquidationPenalty: liquidation penalty too high"
    );
    liquidationPenalty = _liquidationPenalty;
    emit LogSetLiquidationPenalty(msg.sender, _liquidationPenalty);
  }

  /**
   * @notice Creates a Vault
   * @dev Only one vault per address can be created
   */
  function createVault() external virtual whenNotPaused {
    require(
      userToVault[msg.sender] == 0,
      "VaultHandler::createVault: vault already created"
    );
    uint256 id = counter.current();
    userToVault[msg.sender] = id;
    Vault memory vault = Vault(id, 0, 0, msg.sender);
    vaults[id] = vault;
    counter.increment();
    emit LogCreateVault(msg.sender, id);
  }

  /**
   * @notice Adds collateral to vault
   * @param _amount of collateral to add
   * @dev _amount should be higher than 0
   */
  function addCollateral(uint256 _amount)
    external
    virtual
    nonReentrant
    vaultExists
    whenNotPaused
    notZero(_amount)
  {
    require(
      collateralContract.transferFrom(msg.sender, address(this), _amount),
      "VaultHandler::addCollateral: ERC20 transfer did not succeed"
    );
    Vault storage vault = vaults[userToVault[msg.sender]];
    vault.Collateral = vault.Collateral.add(_amount);
    emit LogAddCollateral(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Removes not used collateral from vault
   * @param _amount of collateral to remove
   * @dev _amount should be higher than 0
   */
  function removeCollateral(uint256 _amount)
    external
    virtual
    nonReentrant
    vaultExists
    whenNotPaused
    notZero(_amount)
  {
    Vault storage vault = vaults[userToVault[msg.sender]];
    uint256 currentRatio = getVaultRatio(vault.Id);
    require(
      vault.Collateral >= _amount,
      "VaultHandler::removeCollateral: retrieve amount higher than collateral"
    );
    vault.Collateral = vault.Collateral.sub(_amount);
    if (currentRatio != 0) {
      require(
        getVaultRatio(vault.Id) >= ratio,
        "VaultHandler::removeCollateral: collateral below min required ratio"
      );
    }
    require(
      collateralContract.transfer(msg.sender, _amount),
      "VaultHandler::removeCollateral: ERC20 transfer did not succeed"
    );
    emit LogRemoveCollateral(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Mints TCAP Tokens staking the collateral
   * @param _amount of tokens to mint
   * @dev _amount should be higher than 0
   */
  function mint(uint256 _amount)
    external
    virtual
    nonReentrant
    vaultExists
    whenNotPaused
    notZero(_amount)
  {
    Vault storage vault = vaults[userToVault[msg.sender]];
    uint256 requiredCollateral = requiredCollateral(_amount);
    require(
      vault.Collateral >= requiredCollateral,
      "VaultHandler::mint: not enough collateral"
    );
    vault.Debt = vault.Debt.add(_amount);
    require(
      getVaultRatio(vault.Id) >= ratio,
      "VaultHandler::mint: collateral below min required ratio"
    );
    TCAPToken.mint(msg.sender, _amount);
    emit LogMint(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Burns TCAP Tokens releasing the staked collateral
   * @param _amount of tokens to burn
   * @dev _amount should be higher than 0
   */
  function burn(uint256 _amount)
    external
    virtual
    payable
    nonReentrant
    vaultExists
    whenNotPaused
    notZero(_amount)
  {
    Vault memory vault = vaults[userToVault[msg.sender]];
    _checkBurnFee(_amount);
    _burn(vault.Id, _amount);
    emit LogBurn(msg.sender, vault.Id, _amount);
  }

  /**
   * @notice Allow users to liquidate vaults with low collateral ratio
   * @param _vaultId to liquidate
   * @param _requiredTCAP amount of TCAP to liquidate vault
   */
  function liquidateVault(uint256 _vaultId, uint256 _requiredTCAP)
    external
    payable
    nonReentrant
    whenNotPaused
  {
    Vault storage vault = vaults[_vaultId];
    require(vault.Id != 0, "VaultHandler::liquidateVault: no vault created");
    uint256 vaultRatio = getVaultRatio(vault.Id);
    require(
      vaultRatio < ratio,
      "VaultHandler::liquidateVault: vault is not liquidable"
    );
    uint256 req = requiredLiquidationTCAP(vault.Id);
    require(
      _requiredTCAP == req,
      "VaultHandler::liquidateVault: liquidation amount different than required"
    );
    uint256 reward = liquidationReward(vault.Id);
    _checkBurnFee(_requiredTCAP);
    _burn(vault.Id, _requiredTCAP);
    vault.Collateral = vault.Collateral.sub(reward);
    require(
      collateralContract.transfer(msg.sender, reward),
      "VaultHandler::liquidateVault: ERC20 transfer did not succeed"
    );
    emit LogLiquidateVault(vault.Id, msg.sender, req, reward);
  }

  /**
   * @notice Allows owner to Pause the Contract
   */
  function pause() external onlyOwner {
    _pause();
  }

  /**
   * @notice Allows owner to Unpause the Contract
   */
  function unpause() external onlyOwner {
    _unpause();
  }

  /**
   * @notice Sends the owner of the contract the Fees saved on ETH
   */
  function retrieveFees() external virtual onlyOwner {
    uint256 amount = address(this).balance;
    payable(owner()).transfer(amount);
    emit LogRetrieveFees(msg.sender, amount);
  }

  function getOraclePrice(ChainlinkOracle _oracle)
    public
    virtual
    view
    returns (uint256 price)
  {
    price = _oracle.getLatestAnswer().toUint256().mul(oracleDigits);
  }

  /**
   * @notice Returns the price of the TCAP token
   * @return price of the TCAP Token
   * @dev TCAP token is 18 decimals
   * @dev oracle totalMarketPrice must be in wei format
   * @dev P = M / d
   * P = TCAP Token Price
   * M = Total Crypto Market Cap
   * d = Divisor
   */
  function TCAPPrice() public virtual view returns (uint256 price) {
    uint256 totalMarketPrice = getOraclePrice(tcapOracle);
    price = totalMarketPrice.div(divisor);
  }

  /**
   * @notice Returns the minimal required collateral to mint TCAP token
   * @param _amount uint amount to mint
   * @return collateral of the TCAP Token
   * @dev TCAP token is 18 decimals
   * @dev C = ((P * A * r) / 100) / cp
   * C = Required Collateral
   * P = TCAP Token Price
   * A = Amount to Mint
   * cp = Collateral Price
   * r = Minimun Ratio for Liquidation
   * Is only divided by 100 as eth price comes in wei to cancel the additional 0s
   */
  function requiredCollateral(uint256 _amount)
    public
    virtual
    view
    returns (uint256 collateral)
  {
    uint256 tcapPrice = TCAPPrice();
    uint256 collateralPrice = getOraclePrice(collateralPriceOracle);
    collateral = ((tcapPrice.mul(_amount).mul(ratio)).div(100)).div(
      collateralPrice
    );
  }

  /**
   * @notice Returns the minimal required TCAP to liquidate a Vault
   * @param _vaultId of the vault to liquidate
   * @return amount required of the TCAP Token
   * @dev LT = ((((D * r) / 100) - cTcap) * 100) / (r - (p + 100))
   * cTcap = ((C * cp) / P)
   * LT = Required TCAP
   * D = Vault Debt
   * C = Required Collateral
   * P = TCAP Token Price
   * cp = Collateral Price
   * r = Min Vault Ratio
   * p = Liquidation Penalty
   */
  function requiredLiquidationTCAP(uint256 _vaultId)
    public
    virtual
    view
    returns (uint256 amount)
  {
    Vault memory vault = vaults[_vaultId];
    uint256 tcapPrice = TCAPPrice();
    uint256 collateralPrice = getOraclePrice(collateralPriceOracle);
    uint256 collateralTcap = (vault.Collateral.mul(collateralPrice)).div(
      tcapPrice
    );
    uint256 reqDividend = (
      ((vault.Debt.mul(ratio)).div(100)).sub(collateralTcap)
    )
      .mul(100);
    uint256 reqDivisor = ratio.sub(liquidationPenalty.add(100));
    amount = reqDividend.div(reqDivisor);
  }

  /**
   * @notice Returns Reward for liquidating a vault
   * @param _vaultId of the vault to liquidate
   * @return rewardCollateral for liquidating Vault
   * @dev the returned value is returned on the vault collateral
   * @dev R = (LT * (p  + 100)) / 100
   * R = Liquidation Reward
   * LT = Required Liquidation TCAP
   * p = liquidation penalty
   */
  function liquidationReward(uint256 _vaultId)
    public
    virtual
    view
    returns (uint256 rewardCollateral)
  {
    uint256 req = requiredLiquidationTCAP(_vaultId);
    uint256 tcapPrice = TCAPPrice();
    uint256 collateralPrice = getOraclePrice(collateralPriceOracle);
    uint256 reward = (req.mul(liquidationPenalty.add(100))).div(100);
    rewardCollateral = (reward.mul(tcapPrice)).div(collateralPrice);
  }

  /**
   * @notice Returns the Vault information
   * @param _id of vault
   * @return Id, Collateral, Owner, Debt
   */
  function getVault(uint256 _id)
    external
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

  /**
   * @notice Returns the Collateral Ratio of the Vault
   * @param _vaultId id of vault
   * @return currentRatio
   * @dev vr = (cp * (C * 100)) / D * P
   * vr = Vault Ratio
   * C = Vault Collateral
   * cp = Collateral Price
   * D = Vault Debt
   * P = TCAP Token Price
   */
  function getVaultRatio(uint256 _vaultId)
    public
    virtual
    view
    returns (uint256 currentRatio)
  {
    Vault memory vault = vaults[_vaultId];
    if (vault.Id == 0 || vault.Debt == 0) {
      currentRatio = 0;
    } else {
      uint256 collateralPrice = getOraclePrice(collateralPriceOracle);
      currentRatio = (
        (collateralPrice.mul(vault.Collateral.mul(100))).div(
          vault.Debt.mul(TCAPPrice())
        )
      );
    }
  }

  /**
   * @notice Returns the required fee to burn the TCAP tokens
   * @param _amount to burn
   * @return fee
   * @dev The returned value is returned in wei
   * @dev f = ((P * A * b)/ 100)
   * f = Burn Fee Value
   * P = TCAP Token Price
   * A = Amount to Burn
   * b = Burn Fee %
   */
  function getFee(uint256 _amount) public virtual view returns (uint256 fee) {
    uint256 ethPrice = getOraclePrice(ETHPriceOracle);
    fee = (TCAPPrice().mul(_amount).mul(burnFee)).div(100).div(ethPrice);
  }

  /**
   * @notice Returns the required fee to burn the TCAP tokens
   * @param _amount to burn
   */
  function _checkBurnFee(uint256 _amount) internal {
    uint256 fee = getFee(_amount);
    require(
      fee == msg.value,
      "VaultHandler::burn: burn fee different than required"
    );
  }

  /**
   * @notice Burns an amount of TCAP Tokens
   * @param _vaultId vault id
   * @param _amount to burn
   */
  function _burn(uint256 _vaultId, uint256 _amount) internal {
    Vault storage vault = vaults[_vaultId];
    require(
      vault.Debt >= _amount,
      "VaultHandler::burn: amount greater than debt"
    );
    vault.Debt = vault.Debt.sub(_amount);
    TCAPToken.burn(msg.sender, _amount);
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
    return (interfaceId == _INTERFACE_ID_IVAULT ||
      interfaceId == _INTERFACE_ID_ERC165);
  }
}
