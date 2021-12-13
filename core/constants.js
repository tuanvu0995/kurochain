const VERSION = "00"
const ADDRESS_CHECKSUM_LENGTH = 8

/**
 * API Server
 */
const DEFAULT_ADDRESS = 'localhost'
const DEFAULT_PORT = 3003

const NODE_ROLES = {
    MINER: 'miner',
    FULL: 'full',
    SPV: 'SPV'
}


module.exports = {
    VERSION,
    ADDRESS_CHECKSUM_LENGTH,
    DEFAULT_ADDRESS,
    DEFAULT_PORT,
    NODE_ROLES
}