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
	let handler: string = "0xC257274276a4E539741Ca11b590B9447B26A8051"; //TODO: this should be the handler contract
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
		const defaultOwner = await tcapInstance.owner();
		expect(defaultOwner).to.eq(accounts[0]);
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
	it("...shouldn't allow users to mint", async () => {
		const amount = ethersProvider.utils.parseEther("1000000");
		await expect(tcapInstance.mint(accounts[0], amount)).to.be.revertedWith(
			"Caller is not the handler"
		);
	});
	it("...shouldn't allow users to burn", async () => {
		const amount = ethersProvider.utils.parseEther("1000000");
		await expect(tcapInstance.burn(accounts[1], amount)).to.be.revertedWith(
			"Caller is not the handler"
		);
	});
	it("...should allow owner to set Handler", async () => {
		await expect(
			tcapInstance
				.connect(addr1 as ethersProvider.providers.JsonRpcSigner)
				.setTokenHandler(accounts[1])
		).to.be.revertedWith("Ownable: caller is not the owner");
		await expect(
			tcapInstance.connect(owner as ethersProvider.providers.JsonRpcSigner).setTokenHandler(handler)
		)
			.to.emit(tcapInstance, "LogSetTokenHandler")
			.withArgs(accounts[0], handler);
		let currentHandler = await tcapInstance.tokenHandler();
		expect(currentHandler).to.eq(handler);
	});
	xit("...should allow Handler to mint tokens", async () => {});
	xit("...should allow Handler to burn tokens", async () => {});
	xit("...should allow users to transfer", async () => {});
});
