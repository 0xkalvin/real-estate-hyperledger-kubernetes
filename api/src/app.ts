import express, { Application } from 'express'

import accountController from './controllers/account'

const application: Application = express()

application.use(express.json())

application.get('/_health_check', (_, response) => response.sendStatus(200))
application.post('/accounts', accountController.create)
application.get('/accounts/:id', accountController.show)


export default application