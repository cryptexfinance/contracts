import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {Tcapx} from "../typechain/Tcapx";
require("dotenv").config();

module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (buidlerArguments.network === "ganache" || buidlerArguments.network === "buidlerevm") {
		let DAIHandler = await deployments.get("DAITokenHandler");
		let USDCHandler = await deployments.get("USDCTokenHandler");
		let USDTHandler = await deployments.get("USDTTokenHandler");
		let TcapxDeployment = await deployments.get("TCAPX");
		let TcapxContract = await ethersBuidler.getContract("TCAPX");
		let tcapxAbi = TcapxContract.interface;
		let tcapx = new ethers.Contract(
			TcapxDeployment.address,
			tcapxAbi,
			TcapxContract.signer
		) as Tcapx;

		console.log("adding token Handlers");

		await tcapx.addTokenHandler(DAIHandler.address);
		await tcapx.addTokenHandler(USDCHandler.address);
		await tcapx.addTokenHandler(USDTHandler.address);
	}
};
module.exports.tags = ["Initialize"];
