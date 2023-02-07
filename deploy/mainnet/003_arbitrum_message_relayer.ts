import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "ethers";

module.exports = async ({ ethers, getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "mainnet") {
		return
	}
	const { log } = deployments;
	const namedAccounts = await getNamedAccounts();
	const inboxAddress = "0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f";
    const timelock = "0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8";

	const l1MessageRelayerDeployment = await deployments.deploy("L1MessageRelayer", {
		from: namedAccounts.deployer,
		args: [
			timelock,
			inboxAddress
		],
        skipIfAlreadyDeployed: true,
        log: true,
	});

	log(
		`ArbitrumL1MessageRelayer deployed at ${l1MessageRelayerDeployment.address}
		for ${l1MessageRelayerDeployment.receipt?.gasUsed}`
	);

};

module.exports.tags = ["ArbitrumL1MessageRelayer"];
