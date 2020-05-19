import {expect} from "chai";
const {ethers} = require("@nomiclabs/buidler");
import {Tcapx} from "../typechain/Tcapx";
import "mocha";

describe("TCAP.x Token", async function () {
	let tcapInstance: Tcapx;
	it("...should deploy the contract", async () => {
		const TCAPX = await ethers.getContractFactory("TCAPX");
		tcapInstance = await TCAPX.deploy();
		await tcapInstance.deployed();
		expect(tcapInstance.address).properAddress;
	});
	//
	it("...should set the correct initial values", async () => {
		const symbol = await tcapInstance.symbol();
		const name = await tcapInstance.name();
		const totalSupply = await tcapInstance.totalSupply();
		const decimals = await tcapInstance.decimals();
		expect(symbol).to.eq("TCAPX", "Symbol should equal TCAPX");
		expect(name).to.eq("TCAP.X");
		expect(totalSupply).to.eq(0, "Total supply should be 0");
		expect(decimals).to.eq(18, "Decimals should be 18");
	});
});
