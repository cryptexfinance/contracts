import hre, { deployments, hardhatArguments } from "hardhat";

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "arbitrumGoerli")
			return;
	const { deployIfDifferent, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const l2MessageExecutorDeployResult = await deployments.get("L2MessageExecutor");

	const orchestratorDeployResult = await deployments.deploy("ArbitrumOrchestrator", {
		from: deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		// 	Note: Owner is set to deployer so that initial vaults can be
		// launched without the need for voting
		args: [deployer, l2MessageExecutorDeployResult.address, l2MessageExecutorDeployResult.address]
	});

	log(
		`ArbitrumOrchestrator deployed at ${orchestratorDeployResult.address}
		for ${orchestratorDeployResult.receipt?.gasUsed}`
	);

}
