import application from './app'
import hyperledger from './lib/hyperledger-fabric'
import logger from './lib/logger'

const {
    PORT = 3000,
} = process.env

const onListening = () => logger.info({
    message: `Server is up and kicking on port ${PORT}`
})

hyperledger.createIdentity()
    .then(() => application.listen(PORT, onListening))
