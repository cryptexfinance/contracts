import hre, { deployments, hardhatArguments } from "hardhat";

module.exports = async ({ getNamedAccounts, deployments }: any) => {
    const { deployer } = await getNamedAccounts();
	if (hardhatArguments.network !== "arbitrum")
			return;
	const { deployIfDifferent, log } = deployments;
	// const { deployer } = await getNamedAccounts();
	const l2MessageExecutorProxyDeployResult = await deployments.get("L2MessageExecutorProxy");

    // Params
    const owner = deployer;
    const guardian = "0xa70b638B70154EdfCbb8DbbBd04900F328F32c35"; //TODO: deploy safe in arbitrum

	const orchestratorDeployResult = await deployments.deploy("ArbitrumOrchestrator", {
		from: deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		// 	Note: Owner is set to deployer so that initial vaults can be
		// launched without the need for voting, should be updated to l2MessageExecutorProxyDeployResult
		args: [
			guardian,
			owner,
		]
	});

	log(
		`ArbitrumOrchestrator deployed at ${orchestratorDeployResult.address}
		for ${orchestratorDeployResult.receipt?.gasUsed}`
	);

}
