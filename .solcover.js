module.exports = {
	client: require("ganache-cli"),
	providerOptions: {
		mnemonic: "fetch local valve black attend double eye excite planet primary install allow",
	},
	skipFiles: ["/mocks/Oracle.sol", "/mocks/Stablecoin.sol"],
};
