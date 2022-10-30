import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "ethers";


module.exports = async ({ ethers, getNamedAccounts, deployments }: any) => {
	const { log } = deployments;
	if (process.env.GOERLI_ARBITRUM_MESSAGE_EXECUTOR_ADDRESS === "") {
		log(
			`Please set env GOERLI_ARBITRUM_MESSAGE_EXECUTOR_ADDRESS after deploying L2MessageExecutor on
			arbitrum to run this script`
		);
		return
	}
	if (hardhatArguments.network !== "goerli") {
		return
	}

	const namedAccounts = await getNamedAccounts();

	const l1MessageRelayerDeployment = await deployments.get("L1MessageRelayer");
	const l1MessageRelayer = await ethers.getContractAt("L1MessageRelayer", l1MessageRelayerDeployment.address);
	let [currentExecutor, ] = await l1MessageRelayer.functions.l2MessageExecutor();

	if(currentExecutor === process.env.GOERLI_ARBITRUM_MESSAGE_EXECUTOR_ADDRESS) {
		log(`MessageExecutor already set`);
		return
	}

	let tx = await l1MessageRelayer.functions.updateL2MessageExecutor(
		process.env.GOERLI_ARBITRUM_MESSAGE_EXECUTOR_ADDRESS
	);
	await tx.wait()
	log(`MessageExecutor set successfully!`);

};

module.exports.tags = ["ArbitrumUpdateExecutorAddress"];
