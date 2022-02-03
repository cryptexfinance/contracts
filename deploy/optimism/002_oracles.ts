import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";

const Oracles: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "optimism") {
		const { log } = deployments;
		const timelock = ""; // TODO: add multisig dev

		const namedAccounts = await hre.getNamedAccounts();

		// Check contracts here https://docs.chain.link/docs/optimism-price-feeds/
		const tcapOracle = await deployments.getOrNull("TCAPOracle");
		const tcapAggregator = "0x15772F61e4cDC81c7C1c6c454724CE9c7065A6fF";
		const daiOracle = await deployments.getOrNull("DAIOracle");
		const daiAggregator = "0x8dBa75e83DA73cc766A7e5a0ee71F656BAb470d6";
		const aaveOracle = await deployments.getOrNull("AAVEOracle");
		const aaveAggregator = "0x338ed6787f463394D24813b297401B9F05a8C9d1";
		const ethOracle = await deployments.getOrNull("ETHOracle");
		const ethAggregator = "0x13e3Ee699D1909E989722E753853AE30b17e08c5";
		const linkOracle = await deployments.getOrNull("LINKOracle");
		const linkAggregator = "0xCc232dcFAAE6354cE191Bd574108c1aD03f86450";
		const uniOracle = await deployments.getOrNull("UNIOracle");
		const uniAggregator = "0x11429eE838cC01071402f21C219870cbAc0a59A0";
		const snxOracle = await deployments.getOrNull("SNXOracle");
		const snxAggregator = "0x2FCF37343e916eAEd1f1DdaaF84458a359b53877";
		const crvOracle = await deployments.getOrNull("CRVOracle");
		const crvAggregator = "0xbD92C6c284271c227a1e0bF1786F468b539f51D9";

		if (!tcapOracle) {
			const deployResult = await deployments.deploy("TCAPOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [tcapAggregator, timelock],
			});
			log(`TCAPOracle deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`);
		} else {
			log("TCAPOracle already deployed");
		}

		if (!daiOracle) {
			const deployResult = await deployments.deploy("DAIOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [daiAggregator, timelock],
			});
			log(`DAIOracle deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`);
		} else {
			log("DAIOracle already deployed");
		}

		if (!aaveOracle) {
			const deployResult = await deployments.deploy("AAVEOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [aaveAggregator, timelock],
			});
			log(`AAVEOracle deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`);
		} else {
			log("AAVEOracle already deployed");
		}

		if (!ethOracle) {
			const deployResult = await deployments.deploy("ETHOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [ethAggregator, timelock],
			});
			log(`ETHOracle deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`);
		} else {
			log("ETHOracle already deployed");
		}

		if (!linkOracle) {
			const deployResult = await deployments.deploy("LINKOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [linkAggregator, timelock],
			});
			log(`LINKOracle deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`);
		} else {
			log("LINKOracle already deployed");
		}

		if (!uniOracle) {
			const deployResult = await deployments.deploy("UNIOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [uniAggregator, timelock],
			});
			log(`UNIOracle deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`);
		} else {
			log("UNIOracle already deployed");
		}

		if (!snxOracle) {
			const deployResult = await deployments.deploy("SNXOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [snxAggregator, timelock],
			});
			log(`SNXOracle deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`);
		} else {
			log("SNXOracle already deployed");
		}

		if (!crvOracle) {
			const deployResult = await deployments.deploy("CRVOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [crvAggregator, timelock],
			});
			log(`CRVOracle deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`);
		} else {
			log("CRVOracle already deployed");
		}
	}
};

export default Oracles;
