## `ChainlinkOracle`

Contract in charge of reading the information from a Chainlink oracle. TCAP contracts read the price directly from this contract. 
More information can be found on the [Chainlink Documentation](https://docs.chain.link/).




### `constructor(address _aggregator)` (public)

Called once the contract is deployed.
Set the Chainlink Oracle as an aggregator.



### `setReferenceContract(address _aggregator)` (public)

Changes the reference contract.


Only owner can call it.

### `getLatestAnswer() → int256 price` (public)

Returns the latest answer from the reference contract.




### `getLatestRound() → uint80, int256, uint256, uint256, uint80` (public)

Returns the latest round from the reference contract.



### `getRound(uint80 _id) → uint80, int256, uint256, uint256, uint80` (public)

Returns a given round from the reference contract.




### `getLatestTimestamp() → uint256` (public)

Returns the last time the Oracle was updated.



### `getPreviousAnswer(uint80 _id) → int256` (public)

Returns a previous answer updated on the Oracle.




### `getPreviousTimestamp(uint80 _id) → uint256` (public)

Returns a previous time the Oracle was updated.




### `supportsInterface(bytes4 interfaceId) → bool` (external)

ERC165 Standard for support of interfaces.




