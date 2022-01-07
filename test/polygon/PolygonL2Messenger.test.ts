import { expect } from "chai";
import { Contract, utils } from "ethers";
import hre, { waffle } from "hardhat";

describe("PolygonL2Messenger Test", async function () {
	const [deployer, l1MsgSender, fxChild, acc1] = waffle.provider.getWallets();
	let polygonL2Messenger: Contract;
	let crossChainMsgTester: Contract;
	let abiCoder = new utils.AbiCoder();

	beforeEach(async () => {
		const messenger = await hre.ethers.getContractFactory("PolygonL2Messenger");
		polygonL2Messenger = await messenger.deploy();
		const tester = await hre.ethers.getContractFactory("PolygonMsgTester");
		crossChainMsgTester = await tester.deploy(l1MsgSender.address, polygonL2Messenger.address);

		const [ owner ] = await crossChainMsgTester.functions.owner();
		expect(owner).to.be.eq(l1MsgSender.address);

		await polygonL2Messenger.functions.updateRegisteredReceivers(crossChainMsgTester.address, true);
		const [iscrossChainMsgTesterRegistered] = await polygonL2Messenger.functions.registeredReceivers(crossChainMsgTester.address);
		expect(iscrossChainMsgTesterRegistered).to.be.true;

		await polygonL2Messenger.functions.updateFxRootSender(l1MsgSender.address);
		const [ _fxRootSender ] = await polygonL2Messenger.functions.fxRootSender()
		expect(_fxRootSender).to.be.eq(l1MsgSender.address);

		await polygonL2Messenger.functions.updateFxChild(fxChild.address);
		const [ _fxChild ] = await polygonL2Messenger.functions.fxChild()
		expect(_fxChild).to.be.eq(fxChild.address);
	});

	it("...Successful Message Execution", async () => {
		let ABI = [ "function setMessage(string memory _msg)" ];
		const iface = new hre.ethers.utils.Interface(ABI);
		const new_message = "New Message";
		const _data = iface.encodeFunctionData("setMessage", [new_message]);
		const callData = abiCoder.encode(['address', 'bytes'], [crossChainMsgTester.address, _data])

		// mock l2 call
		await polygonL2Messenger.connect(fxChild).processMessageFromRoot(
			1, l1MsgSender.address, callData
		);

		let [ _msg ] = await crossChainMsgTester.functions.message();
		expect(_msg).to.be.eq(new_message);
	});

	it("...Do not allow non owner to execute Message", async () => {
		let ABI = [ "function setMessage(string memory _msg)" ];
		const iface = new hre.ethers.utils.Interface(ABI);
		const new_message = "New Message";
		const _data = iface.encodeFunctionData("setMessage", [new_message]);
		const callData = abiCoder.encode(['address', 'bytes'], [crossChainMsgTester.address, _data])
		// mock l2 call
		// acc1 is not an owner
		await expect(
			polygonL2Messenger.connect(fxChild).processMessageFromRoot(1, acc1.address, callData)
		).to.be.revertedWith("UNAUTHORIZED_ROOT_ORIGIN");
	});

	it("... revert for unauthorized Fxchild", async () => {
		let ABI = [ "function setMessage(string memory _msg)" ];
		const iface = new hre.ethers.utils.Interface(ABI);
		const new_message = "New Message";
		const _data = iface.encodeFunctionData("setMessage", [new_message]);
		const callData = abiCoder.encode(['address', 'bytes'], [crossChainMsgTester.address, _data])
		// mock l2 call
		// deployer is not fxChild
		await expect(
			polygonL2Messenger.connect(deployer).processMessageFromRoot(1, l1MsgSender.address, callData)
		).to.be.revertedWith("UNAUTHORIZED_CHILD_ORIGIN");
	});

	it("... revert for unauthorized direct call to PolygonMsgTester", async () => {
		// test polygonMessenger.xDomainMessageSender()
		await expect(
			polygonL2Messenger.functions.xDomainMessageSender()
		).to.be.revertedWith("xDomainMessageSender is not set");

		// l1MsgSender is the owner of crossChainMsgTester
		// but polygonMessenger.xDomainMessageSender() check will fail
		await expect(
			crossChainMsgTester.connect(l1MsgSender).setMessage("hello world")
		).to.be.revertedWith("caller is not the owner");
	});

});
