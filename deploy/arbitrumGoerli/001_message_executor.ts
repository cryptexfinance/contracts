import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments, ethers } from "hardhat";
import "ethers";

function requireEnvVariables(envVars: string[]){
  for (const envVar of envVars) {
    if (!process.env[envVar]) {
      throw new Error(`Error: set your '${envVar}' environmental variable `)
    }
  }
}

module.exports = async ({ ethers, getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "arbitrumGoerli") {
		return
	}
	requireEnvVariables(["GOERLI_ARBITRUM_MESSAGE_RELAYER_ADDRESS", "GOERLI_TIMELOCK_ADDRESS"]);

	const { log } = deployments;
	const namedAccounts = await getNamedAccounts();

	const l2MessageExecutorDeployment = await deployments.deploy("L2MessageExecutor", {
		from: namedAccounts.deployer,
		skipIfAlreadyDeployed: true,
		log: true,
	});

	log(
		`ArbitrumLL2MessageExecutor deployed at ${l2MessageExecutorDeployment.address}
		for ${l2MessageExecutorDeployment.receipt?.gasUsed}`
	);

	let ABI = ["function initialize(address)"];
	let iface = new ethers.utils.Interface(ABI);
	// TODO: replace deployer with GOERLI_ARBITRUM_MESSAGE_RELAYER_ADDRESS
	let callData = iface.encodeFunctionData(
		"initialize",
		[process.env["GOERLI_ARBITRUM_MESSAGE_RELAYER_ADDRESS"]]
	);

	const l2MessageExecutorProxyDeployment = await deployments.deploy("L2MessageExecutorProxy", {
		from: namedAccounts.deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		args: [
			l2MessageExecutorDeployment.address,
			process.env["GOERLI_TIMELOCK_ADDRESS"],
			callData
		]
	});

	log(
		`L2MessageExecutorProxy deployed at ${l2MessageExecutorProxyDeployment.address}
		for ${l2MessageExecutorProxyDeployment.receipt?.gasUsed}`
	);


};

module.exports.tags = ["ArbitrumL2MessageExecutor"];
