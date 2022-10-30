import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
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
	requireEnvVariables(["GOERLI_ARBITRUM_MESSAGE_RELAYER_ADDRESS"]);

	const { log } = deployments;
	const namedAccounts = await getNamedAccounts();

	const l2MessageExecutorDeployment = await deployments.deploy("L2MessageExecutor", {
		from: namedAccounts.deployer,
		args: [process.env.GOERLI_ARBITRUM_MESSAGE_RELAYER_ADDRESS],
	});

	log(
		`ArbitrumLL2MessageExecutor deployed at ${l2MessageExecutorDeployment.address}
		for ${l2MessageExecutorDeployment.receipt?.gasUsed}`
	);

// 	TODO: remove this. Added for testing
	await deployments.deploy("Greeter", {
		from: namedAccounts.deployer,
		args: ["Initial Message"],
	});

};

module.exports.tags = ["ArbitrumL2MessageExecutor"];
