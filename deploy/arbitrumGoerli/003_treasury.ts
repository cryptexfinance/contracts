import hre, { deployments, hardhatArguments } from "hardhat";
const timelockAddress = process.env.GOERLI_TIMELOCK_ADDRESS as string

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "arbitrumGoerli")
		return;

	const { deployIfDifferent, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const l2MessageExecutorProxyDeployResult = await deployments.get("L2MessageExecutorProxy");


	const arbitrumTreasuryResult = await deployments.deploy("ArbitrumTreasury", {
		from: deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		args: [
			l2MessageExecutorProxyDeployResult.address,
		],
	});
	log(
		`ArbitrumTreasury deployed at ${arbitrumTreasuryResult.address} for
		${arbitrumTreasuryResult.receipt?.gasUsed}`
	);

}

module.exports.tags = ["ArbitrumTreasury"]
module.exports.dependencies = ["ArbitrumL2MessageExecutor"]
