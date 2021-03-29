import { expect } from "chai";
import { Contract, constants } from "ethers";
import { waffle } from "hardhat";

import { governanceFixture } from "./fixtures";
import { DELAY } from "./utils";

describe("GovernorAlpha", () => {
	// waffle;
	// const provider = new MockProvider({
	// 	ganacheOptions: {
	// 		hardfork: "istanbul",
	// 		mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
	// 		gasLimit: 9999999,
	// 	},
	// });
	const [wallet] = waffle.provider.getWallets();
	const loadFixture = waffle.createFixtureLoader([wallet], waffle.provider);

	let ctx: Contract;
	let timelock: Contract;
	let governorAlpha: Contract;
	beforeEach(async () => {
		const fixture = await loadFixture(governanceFixture);
		ctx = fixture.ctx;
		timelock = fixture.timelock;
		governorAlpha = fixture.governorAlpha;
	});

	it("...should test ctx", async () => {
		const balance = await ctx.balanceOf(wallet.address);
		const totalSupply = await ctx.totalSupply();
		expect(balance).to.be.eq(totalSupply);
	});

	it("...should set timelock", async () => {
		const admin = await timelock.admin();
		expect(admin).to.be.eq(governorAlpha.address);
		const pendingAdmin = await timelock.pendingAdmin();
		expect(pendingAdmin).to.be.eq(constants.AddressZero);
		const delay = await timelock.delay();
		expect(delay).to.be.eq(DELAY);
	});

	it("...should set governor", async () => {
		const votingPeriod = await governorAlpha.votingPeriod();
		expect(votingPeriod).to.be.eq(17280);
		const timelockAddress = await governorAlpha.timelock();
		expect(timelockAddress).to.be.eq(timelock.address);
		const ctxFromGovernor = await governorAlpha.ctx();
		expect(ctxFromGovernor).to.be.eq(ctx.address);
	});
});
