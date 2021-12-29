import hre, { deployments, hardhatArguments } from "hardhat";

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "mumbai")
			return;
	const { deployIfDifferent, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const messengerDeployResult = await deployments.getOrNull("PolygonL2Messenger");

	if(!messengerDeployResult){
		log(
			`PolygonL2Messenger needs to be deployed before deploying PolygonOrchestrator`
		);
		return process.exit(1)
	}

	const orchestratorDeployResult = await deployments.deploy("PolygonOrchestrator", {
		from: deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		// 	TODO: arg2 should timelock address
		args: [deployer, deployer, messengerDeployResult.address]
	});

	log(
		`PolygonOrchestrator deployed at ${orchestratorDeployResult.address} for ${orchestratorDeployResult.receipt?.gasUsed}`
	);

	const polygonL2Messenger = await hre.ethers.getContractAt("PolygonL2Messenger", messengerDeployResult.address);

	const tx = await polygonL2Messenger.functions.setMessageReceiver(orchestratorDeployResult.address);
	const receipt = tx.wait();
}
