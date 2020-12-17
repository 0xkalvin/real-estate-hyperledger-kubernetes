import { Request, Response, NextFunction } from 'express'

import service from '../services/account'
import { PostSchema } from '../schemas/account'

export default {
    async create(request: Request, response: Response, next: NextFunction){
        try {

            const payload = request.body as PostSchema

            const createdAccount = await service.create(payload)
            
            return response.status(201).json(createdAccount)
        } catch (error) {
            return next(error)
        }
    },

    async show(request: Request, response: Response, next: NextFunction){
        try {
            const accountId = request.params.id

            const account = await service.findOne(accountId)
            
            return response.status(200).json(account)
        } catch (error) {
            return next(error)
        }
    },

    async makeDeposit(request: Request, response: Response, next: NextFunction){
        try {
            const accountId = request.params.id
            const amount = request.body.amount as number

            const account = await service.deposit(accountId, amount)
            
            return response.status(200).json(account)
        } catch (error) {
            return next(error)
        }
    },
}
