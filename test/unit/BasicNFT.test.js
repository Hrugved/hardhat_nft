const { assert } = require("chai");
const { network, ethers, deployments } = require("hardhat");
const { devChains } = require("../../helper-hardhat-config");

!devChains.includes(network.name) ? describe.skip() :
describe('Basic NFT', () => {
  let basicNFT, deployer
  beforeEach(async () => {
    deployer = (await ethers.getSigners())[0]
    await deployments.fixture(['basicnft'])
    basicNFT = await ethers.getContract('BasicNFT')
  })
  it('allows users to mint an NFT and update', async () => {
    const txResponse = await basicNFT.mintNFT()
    await txResponse.wait(1)
    const tokenURI = await basicNFT.tokenURI(0)
    const tokenCounter = await basicNFT.getTokenCounter()
    assert.equal(tokenCounter.toString(),'1')
    assert.equal(tokenURI, await basicNFT.TOKEN_URI())
  })
})