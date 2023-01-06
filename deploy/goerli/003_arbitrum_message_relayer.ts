import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "ethers";

module.exports = async ({ ethers, getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "goerli") {
		return
	}
	const { log } = deployments;
	const namedAccounts = await getNamedAccounts();
	const inboxAddress = "0x6BEbC4925716945D46F0Ec336D5C2564F419682C";

	const l1MessageRelayerDeployment = await deployments.deploy("L1MessageRelayer", {
		from: namedAccounts.deployer,
		args: [
			namedAccounts.deployer,
			inboxAddress
		],
	});

	log(
		`ArbitrumL1MessageRelayer deployed at ${l1MessageRelayerDeployment.address}
		for ${l1MessageRelayerDeployment.receipt?.gasUsed}`
	);

};

module.exports.tags = ["ArbitrumL1MessageRelayer"];
