import { expect } from "chai";
import { BigNumber, Contract, constants, utils } from "ethers";
// import { MockProvider, createFixtureLoader, deployContract } from "ethereum-waffle";
import { ecsign, ecrecover } from "ethereumjs-util";
import { governanceFixture } from "./fixtures";
import { expandTo18Decimals, mineBlock } from "./utils";
import { ethers, waffle } from "hardhat";

import Ctx from "../../artifacts/contracts/governance/Ctx.sol/Ctx.json";

const DOMAIN_TYPEHASH = utils.keccak256(
	utils.toUtf8Bytes("EIP712Domain(string name,uint256 chainId,address verifyingContract)")
);

const PERMIT_TYPEHASH = utils.keccak256(
	utils.toUtf8Bytes(
		"Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
	)
);

describe("Ctx", () => {
	// const provider = new MockProvider({
	// 	ganacheOptions: {
	// 		hardfork: "istanbul",
	// 		mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
	// 		gasLimit: 800000000,
	// 	},
	// });

	const [wallet, other0, other1] = waffle.provider.getWallets();
	const loadFixture = waffle.createFixtureLoader([wallet], waffle.provider);

	let ctx: Contract;
	beforeEach(async () => {
		const fixture = await loadFixture(governanceFixture);
		ctx = fixture.ctx;
	});

	it("...should permit", async () => {
		const domainSeparator = utils.keccak256(
			utils.defaultAbiCoder.encode(
				["bytes32", "bytes32", "uint256", "address"],
				[DOMAIN_TYPEHASH, utils.keccak256(utils.toUtf8Bytes("Cryptex")), 31337, ctx.address]
			)
		);

		const owner = wallet.address;
		const spender = other0.address;
		const value = 123;
		const nonce = await ctx.nonces(wallet.address);
		const deadline = constants.MaxUint256;
		const digest = utils.keccak256(
			utils.solidityPack(
				["bytes1", "bytes1", "bytes32", "bytes32"],
				[
					"0x19",
					"0x01",
					domainSeparator,
					utils.keccak256(
						utils.defaultAbiCoder.encode(
							["bytes32", "address", "address", "uint256", "uint256", "uint256"],
							[PERMIT_TYPEHASH, owner, spender, value, nonce, deadline]
						)
					),
				]
			)
		);

		const { v, r, s } = ecsign(
			Buffer.from(digest.slice(2), "hex"),
			Buffer.from(wallet.privateKey.slice(2), "hex")
		);

		await ctx.permit(owner, spender, value, deadline, v, utils.hexlify(r), utils.hexlify(s));
		expect(await ctx.allowance(owner, spender)).to.eq(value);
		expect(await ctx.nonces(owner)).to.eq(1);

		await ctx.connect(other0).transferFrom(owner, spender, value);
	});

	it("...should changes allowance", async () => {
		const amount = ethers.utils.parseEther("10");
		await ctx.connect(other0).approve(other1.address, amount);
		expect(await ctx.allowance(other0.address, other1.address)).to.eq(amount);

		await ctx.connect(other0).increaseAllowance(other1.address, amount);
		expect(await ctx.allowance(other0.address, other1.address)).to.eq(amount.add(amount));

		await ctx.connect(other0).decreaseAllowance(other1.address, amount);
		expect(await ctx.allowance(other0.address, other1.address)).to.eq(amount);
	});

	it("...should allow nested delegation", async () => {
		await ctx.transfer(other0.address, expandTo18Decimals(1));
		await ctx.transfer(other1.address, expandTo18Decimals(2));

		let currectVotes0 = await ctx.getCurrentVotes(other0.address);
		let currectVotes1 = await ctx.getCurrentVotes(other1.address);
		expect(currectVotes0).to.be.eq(0);
		expect(currectVotes1).to.be.eq(0);

		await ctx.connect(other0).delegate(other1.address);
		currectVotes1 = await ctx.getCurrentVotes(other1.address);
		expect(currectVotes1).to.be.eq(expandTo18Decimals(1));

		await ctx.connect(other1).delegate(other1.address);
		currectVotes1 = await ctx.getCurrentVotes(other1.address);
		expect(currectVotes1).to.be.eq(expandTo18Decimals(1).add(expandTo18Decimals(2)));

		await ctx.connect(other1).delegate(wallet.address);
		currectVotes1 = await ctx.getCurrentVotes(other1.address);
		expect(currectVotes1).to.be.eq(expandTo18Decimals(1));
	});

	it("...should mint", async () => {
		const { timestamp: now } = await waffle.provider.getBlock("latest");
		const ctx = await waffle.deployContract(wallet, Ctx, [
			wallet.address,
			wallet.address,
			now + 60 * 60,
		]);
		const supply = await ctx.totalSupply();

		await expect(ctx.mint(wallet.address, 1)).to.be.revertedWith(
			"Ctx::mint: minting not allowed yet"
		);

		let timestamp = await ctx.mintingAllowedAfter();
		await mineBlock(waffle.provider, parseInt(timestamp.toString()));

		await expect(ctx.connect(other1).mint(other1.address, 1)).to.be.revertedWith(
			"Ctx::mint: only the minter can mint"
		);
		await expect(ctx.mint("0x0000000000000000000000000000000000000000", 1)).to.be.revertedWith(
			"Ctx::mint: cannot transfer to the zero address"
		);
		await expect(ctx.mint(ctx.address, 1)).to.be.revertedWith(
			"Ctx::mint: cannot transfer to the Ctx address"
		);

		// can mint up to 2%
		const mintCap = BigNumber.from(await ctx.mintCap());
		const amount = supply.mul(mintCap).div(100);
		await ctx.mint(wallet.address, amount);
		expect(await ctx.balanceOf(wallet.address)).to.be.eq(supply.add(amount));

		timestamp = await ctx.mintingAllowedAfter();
		await mineBlock(waffle.provider, parseInt(timestamp.toString()));
		// cannot mint 2.01%
		await expect(ctx.mint(wallet.address, supply.mul(mintCap.add(1)))).to.be.revertedWith(
			"Ctx::mint: exceeded mint cap"
		);
	});
});
