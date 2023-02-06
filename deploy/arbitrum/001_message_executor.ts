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

    const mainnetMessageRelayer = "0x209c23db16298504354112fa4210d368e1d564da";

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

    const l2AdminProxyDeployment = await deployments.deploy("L2AdminProxy", {
		from: namedAccounts.deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		args: [
			mainnetMessageRelayer
		]
	});

	let ABI = ["function initialize(address)"];
	let iface = new ethers.utils.Interface(ABI);
	let callData = iface.encodeFunctionData(
		"initialize",
		[mainnetMessageRelayer]
	);

	const l2MessageExecutorProxyDeployment = await deployments.deploy("L2MessageExecutorProxy", {
		from: namedAccounts.deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		args: [
			l2MessageExecutorDeployment.address,
			l2AdminProxyDeployment.address,
			callData
		]
	});

	log(
		`L2MessageExecutorProxy deployed at ${l2MessageExecutorProxyDeployment.address}
		for ${l2MessageExecutorProxyDeployment.receipt?.gasUsed}`
	);


};

module.exports.tags = ["ArbitrumL2MessageExecutor"];
