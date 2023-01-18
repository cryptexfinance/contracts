import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";

module.exports = async ({ ethers, getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network === "goerli") {
		const Ctx = await deployments.getOrNull("Ctx");
		if (Ctx) return;

		const { log } = deployments;
		const namedAccounts = await getNamedAccounts();
        console.log(namedAccounts.deployerforge);
		const oneYear = 1675175407; // Mon, January 24 2023
		const threeDays = 259200;
		const [owner] = await ethers.getSigners();

		let nonce = await owner.getTransactionCount();
		const ctxAddress = ethers.utils.getContractAddress({
			from: namedAccounts.deployer,
			nonce: nonce++,
		});

		const timelockAddress = ethers.utils.getContractAddress({
			from: namedAccounts.deployer,
			nonce: nonce++,
		});

		const governorAddress = ethers.utils.getContractAddress({
			from: namedAccounts.deployer,
			nonce: nonce++,
		});
		try {
			const ctxDeployment = await deployments.get("Ctx");
		} catch (error: any) {
			log(error.message);
			const ctxDeployment = await deployments.deploy("Ctx", {
				from: namedAccounts.deployer,
				args: [namedAccounts.deployer, timelockAddress, oneYear],
			});
			log(`Ctx deployed at ${ctxDeployment.address} for ${ctxDeployment.receipt?.gasUsed}`);
		}

		const timelockDeployment = await deployments.deploy("Timelock", {
			from: namedAccounts.deployer,
			args: [governorAddress, threeDays],
		});

		log(
			`Timelock deployed at ${timelockDeployment.address} for ${timelockDeployment.receipt?.gasUsed}`
		);

		const governorDeployment = await deployments.deploy("GovernorBeta", {
			from: namedAccounts.deployer,
			args: [timelockAddress, ctxAddress, namedAccounts.deployer],
		});

		log(
			`Governor Beta deployed at ${governorDeployment.address} for ${governorDeployment.receipt?.gasUsed}`
		);
	}
};
module.exports.tags = ["Governance"];
