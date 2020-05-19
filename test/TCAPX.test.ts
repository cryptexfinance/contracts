import {expect} from "chai";
const {ethers} = require("@nomiclabs/buidler");
import {Tcapx} from "../typechain/Tcapx";
import "mocha";
import {TcapxFactory} from "../typechain/TcapxFactory";
import {ethers as ethersProvider} from "ethers";
//
describe("TCAP.x Token", async function () {
	let tcapInstance: Tcapx;
	let [owner, addr1]: ethersProvider.providers.JsonRpcSigner[] | undefined[] = [
		undefined,
		undefined,
	];
	let accounts: string[] = [];
	before("Set Accounts", async () => {
		let [acc0, acc1] = await ethers.getSigners();
		owner = acc0;
		addr1 = acc1;
		if (owner && addr1) {
			accounts.push(await owner.getAddress());
			accounts.push(await addr1.getAddress());
		}
	});
	it("...should deploy the contract", async () => {
		const TCAPX: TcapxFactory = await ethers.getContractFactory("TCAPX");
		tcapInstance = await TCAPX.deploy("TCAP.X", "TCAPX", 11);
		await tcapInstance.deployed();
		expect(tcapInstance.address).properAddress;
	});
	it("...should set the correct initial values", async () => {
		const symbol = await tcapInstance.symbol();
		const name = await tcapInstance.name();
		const decimals = await tcapInstance.decimals();
		expect(symbol).to.eq("TCAPX", "Symbol should equal TCAPX");
		expect(name).to.eq("TCAP.X");
		expect(decimals).to.eq(18, "Decimals should be 18");
	});
	it("...should have the ERC20 standard functions", async () => {
		const totalSupply = await tcapInstance.totalSupply();
		expect(totalSupply).to.eq(0, "Total supply should be 0");
		const balance = await tcapInstance.balanceOf(accounts[0]);
		expect(balance).to.eq(0, "Balance should be 0");
	});
	it("...should allow to approve tokens", async () => {
		const amount = ethersProvider.utils.parseEther("100");
		await tcapInstance
			.connect(owner as ethersProvider.providers.JsonRpcSigner)
			.approve(accounts[1], amount);
		const allowance = await tcapInstance.allowance(accounts[0], accounts[1]);
		expect(allowance).to.eq(amount);
	});
	xit("...should allow users to transfer", async () => {});
	xit("...shouldn't allow users to burn", async () => {});
	xit("...shouldn't allow users to mint", async () => {});
	xit("...should allow owner to set Handler", async () => {});
	xit("...should allow Handler to mint tokens", async () => {});
	xit("...should allow Handler to burn tokens", async () => {});
});
