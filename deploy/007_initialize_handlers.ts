import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {DaiTokenHandler} from "../typechain/DaiTokenHandler";
import {UsdcTokenHandler} from "../typechain/UsdcTokenHandler";
import {UsdtTokenHandler} from "../typechain/UsdtTokenHandler";
import {WethTokenHandler} from "../typechain/WethTokenHandler";
require("dotenv").config();
module.exports = async ({deployments}: any) => {
	if (
		buidlerArguments.network === "goerli" ||
		buidlerArguments.network === "ganache" ||
		buidlerArguments.network === "buidlerevm"
	) {
		let DAIHandler = await deployments.get("DAITokenHandler");
		let USDCHandler = await deployments.get("USDCTokenHandler");
		let USDTHandler = await deployments.get("USDTTokenHandler");
		let WETHHandler = await deployments.get("WETHTokenHandler");
		let tcapx = await deployments.get("TCAPX");

		let divisor = process.env.DIVISOR as string;
		let ratio = process.env.RATIO as string;
		let burnFee = process.env.BURN_FEE as string;
		let whitelist = process.env.WHITELIST as string;
		let oracle = await deployments.get("Oracle");
		let priceFeed = await deployments.get("PriceFeed");

		let daiHandlerContract = await ethersBuidler.getContract("DAITokenHandler");
		let usdcHandlerContract = await ethersBuidler.getContract("USDCTokenHandler");
		let usdtHandlerContract = await ethersBuidler.getContract("USDTTokenHandler");
		let wethHandlerContract = await ethersBuidler.getContract("WETHTokenHandler");

		let DAIContract = await deployments.get("DAI");
		let USDCContract = await deployments.get("USDC");
		let USDTContract = await deployments.get("USDT");
		let WETHContract = await deployments.get("WETH");

		let dai = new ethers.Contract(
			DAIHandler.address,
			daiHandlerContract.interface,
			daiHandlerContract.signer
		) as DaiTokenHandler;

		let usdc = new ethers.Contract(
			USDCHandler.address,
			usdcHandlerContract.interface,
			usdcHandlerContract.signer
		) as UsdcTokenHandler;

		let usdt = new ethers.Contract(
			USDTHandler.address,
			usdtHandlerContract.interface,
			usdtHandlerContract.signer
		) as UsdtTokenHandler;

		let weth = new ethers.Contract(
			WETHHandler.address,
			wethHandlerContract.interface,
			wethHandlerContract.signer
		) as WethTokenHandler;

		console.log("setting token address", tcapx.address);
		await dai.setTCAPXContract(tcapx.address);
		await usdc.setTCAPXContract(tcapx.address);
		await usdt.setTCAPXContract(tcapx.address);
		await weth.setTCAPXContract(tcapx.address);

		console.log("setting collateral address");
		await dai.setCollateralContract(DAIContract.address);
		await usdc.setCollateralContract(USDCContract.address);
		await usdt.setCollateralContract(USDTContract.address);
		await weth.setCollateralContract(WETHContract.address);

		console.log("setting the divisor", divisor);
		await dai.setDivisor(divisor);
		await usdc.setDivisor(divisor);
		await usdt.setDivisor(divisor);
		await weth.setDivisor(divisor);

		console.log("setting ratio", ratio);
		await dai.setRatio(ratio);
		await usdc.setRatio(ratio);
		await usdt.setRatio(ratio);
		await weth.setRatio(ratio);

		console.log("setting burn fee", burnFee);
		await dai.setBurnFee(burnFee);
		await usdc.setBurnFee(burnFee);
		await usdt.setBurnFee(burnFee);
		await weth.setBurnFee(burnFee);

		console.log("setting oracle", oracle.address);
		await dai.setTCAPOracle(oracle.address);
		await usdc.setTCAPOracle(oracle.address);
		await usdt.setTCAPOracle(oracle.address);
		await weth.setTCAPOracle(oracle.address);
		await weth.setETHPriceOracle(priceFeed.address);

		console.log("setting whitelist", whitelist);
		await dai.enableWhitelist(Boolean(whitelist));
		await usdc.enableWhitelist(Boolean(whitelist));
		await usdt.enableWhitelist(Boolean(whitelist));
		await weth.enableWhitelist(Boolean(whitelist));
	}
};
module.exports.tags = ["Initialize"];
