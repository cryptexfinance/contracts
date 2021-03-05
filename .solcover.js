module.exports = {
	client: require("ganache-cli"),
	providerOptions: {
		mnemonic: "fetch local valve black attend double eye excite planet primary install allow",
		default_balance_ether: 100000000,
		gas: 800000000,
	},
	skipFiles: [
		"/oracles/ChainlinkOracle.sol",
		"/mocks/Oracle.sol",
		"/mocks/Stablecoin.sol",
		"/mocks/",
	],
};
