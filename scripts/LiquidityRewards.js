// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
	// Hardhat always runs the compile task when running scripts with its command
	// line interface.
	//
	// If this script is run directly using `node` you may want to call compile
	// manually to make sure everything is compiled
	// await hre.run('compile');

	// We get the contract to deploy

	const namedAccounts = await hre.getNamedAccounts();
	const { deployments } = hre;

	let vestingRatio = process.env.VESTING_RATIO;
	let ctxDeployment = await deployments.get("Ctx");

	let owner = namedAccounts.deployer;
	let rewardsToken = ctxDeployment.address;
	let stakingToken = process.env.UNI_TCAP_ETH;

	// Vesting
	const { timestamp: now } = await ethers.provider.getBlock("latest");
	const vestingBegin = now + 60;
	const vestingEnd = vestingBegin + 60 * 60 * 24 * 182;

	const LiquidtyReward = await hre.ethers.getContractFactory("LiquidityReward");
	let liquid = await LiquidtyReward.deploy(
		owner,
		rewardsToken,
		stakingToken,
		vestingBegin,
		vestingEnd,
		vestingRatio
	);

	await liquid.deployed();

	console.log("Liquidity Reward deployed to:", liquid.address);

	let stakingToken = process.env.UNI_TCAP_WBTC;

	let liquid = await LiquidtyReward.deploy(
		owner,
		rewardsToken,
		stakingToken,
		vestingBegin,
		vestingEnd,
		vestingRatio
	);

	await liquid.deployed();

	console.log("Liquidity Reward deployed to:", liquid.address);

	let stakingToken = process.env.UNI_TCAP_DAI;

	let liquid = await LiquidtyReward.deploy(
		owner,
		rewardsToken,
		stakingToken,
		vestingBegin,
		vestingEnd,
		vestingRatio
	);

	await liquid.deployed();

	console.log("Liquidity Reward deployed to:", liquid.address);

	let stakingToken = process.env.UNI_CTX_ETH;

	let liquid = await LiquidtyReward.deploy(
		owner,
		rewardsToken,
		stakingToken,
		vestingBegin,
		vestingEnd,
		vestingRatio
	);

	await liquid.deployed();

	console.log("Liquidity Reward deployed to:", liquid.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
