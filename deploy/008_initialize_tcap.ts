// import {ethers} from "ethers";
// import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
// import {Tcap} from "../typechain/Tcap";
// require("dotenv").config();

// module.exports = async ({deployments}: any) => {
// 	if (buidlerArguments.network === "rinkeby" || buidlerArguments.network === "ganache") {
// 		let DAIHandler = await deployments.get("DAIVaultHandler");
// 		let BTCHandler = await deployments.get("BTCVaultHandler");
// 		let WETHHandler = await deployments.get("WETHVaultHandler");
// 		let TcapDeployment = await deployments.get("TCAP");
// 		let TcapContract = await ethersBuidler.getContractFactory("TCAP");
// 		let tcapAbi = TcapContract.interface;
// 		let tcap = new ethers.Contract(TcapDeployment.address, tcapAbi, TcapContract.signer) as Tcap;

// 		console.log("adding token Handlers");

// 		await tcap.addTokenHandler(DAIHandler.address);
// 		await tcap.addTokenHandler(BTCHandler.address);
// 		await tcap.addTokenHandler(WETHHandler.address);
// 	}
// };
// module.exports.tags = ["Initialize"];
