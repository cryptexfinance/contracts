import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";
import { ethers } from "ethers";

const usdcVaultHandler: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "mainnet") {
		console.log("=====Mainnet Deploy=====");
		const { log } = deployments;

		const namedAccounts = await hre.getNamedAccounts();
		let usdcOracle = await deployments.getOrNull("UsdcOracle");
		const usdcAggregator = "\t0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";
		const treasury = "0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8"; // Timelock

		if (!usdcOracle) {
			const usdcOracleDeployment = await deployments.deploy("UsdcOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				args: [usdcAggregator, treasury],
				skipIfAlreadyDeployed: true,
				log: true,
			});
			log(
				`UsdcOracle deployed at ${usdcOracleDeployment.address} for ${usdcOracleDeployment.receipt?.gasUsed}`
			);
		} else {
			log("UsdcOracle already deployed");
		}
	}
};

export default usdcVaultHandler;
