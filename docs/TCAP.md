## `TCAP`

ERC20 token on the Ethereum Blockchain that provides total exposure to the cryptocurrency sector.



### `onlyVault()`

Reverts if called by any account that is not a vault.




### `constructor(string _name, string _symbol, uint256 _cap, contract Orchestrator _orchestrator)` (public)

Constructor




### `addVaultHandler(address _vaultHandler)` (external)

Adds a new address as a vault


Only owner can call it

### `removeVaultHandler(address _vaultHandler)` (external)

Removes an address as a vault


Only owner can call it

### `mint(address _account, uint256 _amount)` (external)

Mints TCAP Tokens


Only vault can call it

### `burn(address _account, uint256 _amount)` (external)

Burns TCAP Tokens


Only vault can call it

### `setCap(uint256 _cap)` (external)

Sets maximum value the total supply of TCAP can have


When capEnabled is true, mint is not allowed to issue tokens that would increase the total supply above or equal the specified capacity.
Only owner can call it

### `enableCap(bool _enable)` (external)

Enables or Disables the Total Supply Cap.


When capEnabled is true, minting will not be allowed above the max capacity. It can exist a supply above the cap, but it prevents minting above the cap.
Only owner can call it

### `supportsInterface(bytes4 _interfaceId) → bool` (external)

ERC165 Standard for support of interfaces




### `_beforeTokenTransfer(address _from, address _to, uint256 _amount)` (internal)

executes before each token transfer or mint


See {ERC20-_beforeTokenTransfer}.
minted tokens must not cause the total supply to go over the cap.
Reverts if the to address is equal to token address


### `VaultHandlerAdded(address _owner, address _tokenHandler)`

An event emitted when a vault handler is added



### `VaultHandlerRemoved(address _owner, address _tokenHandler)`

An event emitted when a vault handler is removed



### `NewCap(address _owner, uint256 _amount)`

An event emitted when the cap value is updated



### `NewCapEnabled(address _owner, bool _enable)`

An event emitted when the cap is enabled or disabled



