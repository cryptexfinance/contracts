import hre, { deployments, hardhatArguments } from "hardhat";

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	// exit if network != mumbai
	if (hardhatArguments.network !== "mumbai")
		return;

	const { deployIfDifferent, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const messengerDeployResult = await deployments.deploy("PolygonL2Messenger", {
		from: deployer,
		skipIfAlreadyDeployed: true,
		log: true,
	});
	log(
		`PolygonL2Messenger deployed at ${messengerDeployResult.address} for ${messengerDeployResult.receipt?.gasUsed}`
	);

}

module.exports.tags = ["PolygonL2Messenger"]
