import hre, { deployments, hardhatArguments } from "hardhat";

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "mainnet")
		return;

	const { deployIfDifferent, log } = deployments;
	const { deployer } = await getNamedAccounts();


	const governanceCCIPRelay = await deployments.deploy("GovernanceCCIPRelay", {
		from: deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		args: [
			timelockAddress,
			ccipMainnetRouter,
			destinationChainSelectors,
			destinationReceivers
		],
	});
	console.log(
		`GovernanceCCIPRelay deployed at ${governanceCCIPRelay.address} for
		${governanceCCIPRelay.receipt?.gasUsed}`
	);

}

module.exports.tags = ["GovernanceCCIPRelay"]
