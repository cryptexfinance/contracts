import {buidlerArguments} from "@nomiclabs/buidler";
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (
		buidlerArguments.network === "goerli" ||
		buidlerArguments.network === "ganache" ||
		buidlerArguments.network === "buidlerevm"
	) {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		let handlerContract;
		try {
			handlerContract = await deployments.get("USDCTokenHandler");
		} catch (error) {
			try {
				log(error.message);

				const deployResult = await deployIfDifferent(
					["data"],
					"USDCTokenHandler",
					{from: deployer, gas: 4000000},
					"USDCTokenHandler"
				);
				handlerContract = await deployments.get("USDCTokenHandler");
				if (deployResult.newlyDeployed) {
					log(
						`USDCTokenHandler deployed at ${handlerContract.address} for ${deployResult.receipt.gasUsed}`
					);
				}
			} catch (error) {
				log(error.message);
			}
		}
	}
};
module.exports.tags = ["USDCTokenHandler"];
