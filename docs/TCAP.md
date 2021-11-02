## `TCAP`

ERC20 token on the Ethereum Blockchain that provides total exposure to the cryptocurrency sector.

### `onlyVault()`

Reverts if called by any account that is not a vault.

### `constructor(string _name, string _symbol, uint256 _cap, contract Orchestrator _orchestrator)` (public)

Constructs a new TCAP.

### `addVaultHandler(address _vaultHandler)` (external)

Adds a new address as a vault. 

Only the owner can call this function. 

### `removeVaultHandler(address _vaultHandler)` (external)

Removes an address as a vault. 

Only the owner can call this function.

### `mint(address _account, uint256 _amount)` (external)

Mints TCAP tokens. 

Only the vault can call this function.

### `burn(address _account, uint256 _amount)` (external)

Burns TCAP tokens. 

Only the vault can call this function.

### `setCap(uint256 _cap)` (external)

Sets the maximum value the total supply of TCAP can have.

When `capEnabled` is true, minting cannot issue tokens that would increase the total supply above or equal the specified capacity.

Only the owner can call this function.

### `enableCap(bool _enable)` (external)

Enables or disables the total supply cap.

When `capEnabled` is true, minting will not be allowed above the max capacity. 
A supply above the cap is possible, but further minting above the cap will be prevented. 

Only the owner can call this function.

### `supportsInterface(bytes4 _interfaceId) → bool` (external)

ERC165 Standard for support of interfaces.

### `_beforeTokenTransfer(address _from, address _to, uint256 _amount)` (internal)

Executes before each token transfer or mint.

See {ERC20-_beforeTokenTransfer}.

Minted tokens must not cause the total supply to go over the cap.

Reverts if the `to` address is equal to the token address.

### `VaultHandlerAdded(address _owner, address _tokenHandler)`

An event emitted when a vault handler has been added.

### `VaultHandlerRemoved(address _owner, address _tokenHandler)`

An event emitted when a vault handler has been removed.

### `NewCap(address _owner, uint256 _amount)`

An event emitted when the cap value has been updated.

### `NewCapEnabled(address _owner, bool _enable)`

An event emitted when the cap has been enabled or disabled.
