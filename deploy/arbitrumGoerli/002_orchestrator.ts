import hre, { deployments, hardhatArguments } from "hardhat";

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "arbitrumGoerli")
			return;
	const { deployIfDifferent, log } = deployments;
	const { deployer } = await getNamedAccounts();
<<<<<<< HEAD
	// const l2MessageExecutorDeployResult = await deployments.get("L2MessageExecutor");
=======
	const l2MessageExecutorProxyDeployResult = await deployments.get("L2MessageExecutorProxy");
>>>>>>> a4d0910dde060b4af77d359de34a7f135583b739

	const orchestratorDeployResult = await deployments.deploy("ArbitrumOrchestrator", {
		from: deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		// 	Note: Owner is set to deployer so that initial vaults can be
		// launched without the need for voting
<<<<<<< HEAD
		args: [deployer, deployer]
        // args: [deployer, l2MessageExecutorDeployResult.address, l2MessageExecutorDeployResult.address]
=======
		args: [
			deployer,
			deployer,
		]
>>>>>>> a4d0910dde060b4af77d359de34a7f135583b739
	});

	log(
		`ArbitrumOrchestrator deployed at ${orchestratorDeployResult.address}
		for ${orchestratorDeployResult.receipt?.gasUsed}`
	);

}
