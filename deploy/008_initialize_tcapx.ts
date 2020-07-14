import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {Tcapx} from "../typechain/Tcapx";
require("dotenv").config();

module.exports = async ({deployments}: any) => {
	if (buidlerArguments.network === "rinkeby" || buidlerArguments.network === "ganache") {
		let DAIHandler = await deployments.get("DAIVaultHandler");
		let BTCHandler = await deployments.get("BTCVaultHandler");
		let WETHHandler = await deployments.get("WETHVaultHandler");
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
		await tcapx.addTokenHandler(BTCHandler.address);
		await tcapx.addTokenHandler(WETHHandler.address);
	}
};
module.exports.tags = ["Initialize"];
