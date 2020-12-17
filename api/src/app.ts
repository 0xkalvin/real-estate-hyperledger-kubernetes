import express, { Application } from 'express'

import accountController from './controllers/account'
import realEstateController from './controllers/real-estate'
import offerController from './controllers/offer'

const application: Application = express()

application.use(express.json())

application.get('/_health_check', (_, response) => response.sendStatus(200))
application.post('/accounts', accountController.create)
application.get('/accounts/:id', accountController.show)
application.post('/accounts/:id/deposits', accountController.makeDeposit)
application.post('/real_estate', realEstateController.create)
application.get('/real_estate/:id', realEstateController.show)
application.post('/real_estate/:id/transfers', realEstateController.transfer)
application.post('/offers', offerController.create)
application.get('/offers/:id', offerController.show)
application.post('/offers/:id/signatures', offerController.addSignature)

export default application