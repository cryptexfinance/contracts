var expect = require("chai").expect;
var ethersProvider = require("ethers");
const { exec } = require("child_process");

describe("Chainlink Oracle", async function () {
	let chainlinkInstance;
	let [owner, addr1, handler, handler2] = [];
	let accounts = [];

	before("Set Accounts", async () => {
		let [acc0, acc1, acc3, acc4, acc5] = await ethers.getSigners();
		owner = acc0;
		addr1 = acc1;
		handler = acc3;
		handler2 = acc4;
		if (owner && addr1 && handler) {
			accounts.push(await owner.getAddress());
			accounts.push(await addr1.getAddress());
			accounts.push(await handler.getAddress());
			accounts.push(await handler2.getAddress());
			accounts.push(await acc5.getAddress());
		}
	});

	it("...should deploy the contract", async () => {
		const aggregator = await ethers.getContractFactory("AggregatorInterface");
		let aggregatorInstance = await aggregator.deploy();
		const oracle = await ethers.getContractFactory("ChainlinkOracle");
		chainlinkInstance = await oracle.deploy(aggregatorInstance.address, accounts[0]);
		await chainlinkInstance.deployed();
		expect(chainlinkInstance.address).properAddress;
	});

	it("...should set the parameters", async () => {
		const currentOwner = await chainlinkInstance.owner();
		expect(currentOwner).eq(accounts[0]);
	});

	it("...should get the oracle answer", async () => {
		const price = ethersProvider.BigNumber.from("39752768946");
		let ethPrice = await chainlinkInstance.getLatestAnswer();
		expect(ethPrice).to.eq(price);
	});
});
