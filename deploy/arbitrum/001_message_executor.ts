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
	if (hardhatArguments.network !== "arbitrum") {
		return
	}

    const arbitrumMessageRelayer = null;
    const timelock = "0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8";

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
	let callData = iface.encodeFunctionData(
		"initialize",
		[arbitrumMessageRelayer]
	);

	const l2MessageExecutorProxyDeployment = await deployments.deploy("L2MessageExecutorProxy", {
		from: namedAccounts.deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		args: [
			l2MessageExecutorDeployment.address,
			timelock,
			callData
		]
	});

	log(
		`L2MessageExecutorProxy deployed at ${l2MessageExecutorProxyDeployment.address}
		for ${l2MessageExecutorProxyDeployment.receipt?.gasUsed}`
	);


};

module.exports.tags = ["ArbitrumL2MessageExecutor"];
