import { expect } from "chai";
import { Contract, Wallet, providers } from "ethers";
import { waffle } from "hardhat";
const { deployContract } = waffle;

import Ctx from "../../artifacts/contracts/governance/Ctx.sol/Ctx.json";
import Timelock from "../../artifacts/contracts/governance/Timelock.sol/Timelock.json";
import GovernorAlpha from "../../artifacts/contracts/governance/GovernorAlpha.sol/GovernorAlpha.json";

import { DELAY } from "./utils";

interface GovernanceFixture {
	ctx: Contract;
	timelock: Contract;
	governorAlpha: Contract;
}

export async function governanceFixture(
	[wallet]: Wallet[],
	provider: providers.Web3Provider
): Promise<GovernanceFixture> {
	// deploy CTX, sending the total supply to the deployer
	const { timestamp: now } = await provider.getBlock("latest");
	let nonce = await wallet.getTransactionCount();
	nonce++;
	const timelockAddress = Contract.getContractAddress({
		from: wallet.address,
		nonce: nonce++,
	});

	// deploy timelock, controlled by what will be the governor
	const governorAlphaAddress = Contract.getContractAddress({
		from: wallet.address,
		nonce: nonce++,
	});

	const ctx = await deployContract(wallet, Ctx, [wallet.address, timelockAddress, now + 60 * 60]);

	const timelock = await deployContract(wallet, Timelock, [governorAlphaAddress, DELAY]);
	expect(timelock.address).to.be.eq(timelockAddress);

	// deploy governorAlpha
	const governorAlpha = await deployContract(wallet, GovernorAlpha, [
		timelock.address,
		ctx.address,
	]);
	expect(governorAlpha.address).to.be.eq(governorAlphaAddress);

	return { ctx, timelock, governorAlpha };
}
