const { devChains } = require("../helper-hardhat-config")
const {ethers} = require('hardhat')
const BASE_FEE = ethers.utils.parseEther('0.25')
const GAS_PRICE_LINK = 1e9

const DECIMALS = "18"
const INITIAL_PRICE = ethers.utils.parseUnits('2000','ether')

module.exports = async function ({getNamedAccounts, deployments}) {
  const {deploy,log} = deployments
  const {deployer}=await getNamedAccounts()
  const args = [BASE_FEE,GAS_PRICE_LINK]
  if(devChains.includes(network.name)) {
    log('deploying mocks to local network...')
    await deploy('VRFCoordinatorV2Mock', {
      from: deployer,
      log: true,
      args: args
    })
    await deploy('MockV3Aggregator',{
      from:deployer,
      log:true,
      args: [DECIMALS,INITIAL_PRICE]
    })
    log('Mocks deployed!')
    log('-----------------------------------------------------------')
  }
}

module.exports.tags = ['all','mocks']