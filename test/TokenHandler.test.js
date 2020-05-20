var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("TCAP.x Token Handler", async function () {
	let tokenHandler;
	let [owner, addr1, addr2] = [];
	let accounts = [];
	let tokenAddress = "";

	before("Set Accounts", async () => {
		let [acc0, acc1, acc3] = await ethers.getSigners();
		owner = acc0;
		addr1 = acc1;
		addr2 = acc3;
		if (owner && addr1 && handler) {
			accounts.push(await owner.getAddress());
			accounts.push(await addr1.getAddress());
			accounts.push(await addr2.getAddress());
		}
	});
});
