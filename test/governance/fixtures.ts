import { expect } from "chai";
import { Contract, Wallet, providers } from "ethers";
import { waffle } from "hardhat";
const { deployContract } = waffle;

import Ctx from "../../artifacts/contracts/governance/Ctx.sol/Ctx.json";
import Timelock from "../../artifacts/contracts/governance/Timelock.sol/Timelock.json";
import GovernorBeta from "../../artifacts/contracts/governance/GovernorBeta.sol/GovernorBeta.json";

import { DELAY } from "./utils";

interface GovernanceFixture {
	ctx: Contract;
	timelock: Contract;
	governorBeta: Contract;
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
	const governorBetaAddress = Contract.getContractAddress({
		from: wallet.address,
		nonce: nonce++,
	});

	const ctx = await deployContract(wallet, Ctx, [wallet.address, timelockAddress, now + 60 * 60]);

	const timelock = await deployContract(wallet, Timelock, [governorBetaAddress, DELAY]);

	expect(timelock.address).to.be.eq(timelockAddress);

	// deploy governorBeta
	const governorBeta = await deployContract(wallet, GovernorBeta, [
		timelock.address,
		ctx.address,
		wallet.address,
	]);
	expect(governorBeta.address).to.be.eq(governorBetaAddress);
	return { ctx, timelock, governorBeta };
}
