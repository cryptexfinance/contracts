var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("TCAP.x Token Handler", async function () {
	let tokenHandler;
	let [owner, addr1, addr2] = [];
	let accounts = [];
	let tokenAddress = "";

	before("Set Accounts", async () => {
		let [acc0, acc1, acc3] = await ethers.getSigners();
		owner = acc0;
		addr1 = acc1;
		addr2 = acc3;
		if (owner && addr1) {
			accounts.push(await owner.getAddress());
			accounts.push(await addr1.getAddress());
			accounts.push(await addr2.getAddress());
		}
	});
	xit("...should deploy the contract", async () => {});
	xit("...should set the token contract", async () => {});
	xit("...should set the oracle contract", async () => {});
	xit("...should set the stablecoin contract", async () => {});
	xit("...should return the token price", async () => {});
	xit("...should allow investor to create collateral position", async () => {});
	xit("...should allow investor to add collateral", async () => {});
	xit("...should allow investor to retrieve unused collateral", async () => {});
	xit("...should allow users to liquidate investors", async () => {});
	xit("LIQUIDATION CONFIGURATION TESTS", async () => {});
});
