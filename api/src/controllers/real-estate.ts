import { Request, Response, NextFunction } from 'express'

import service from '../services/real-estate'
import { PostSchema } from '../schemas/real-estate'

export default {
    async create(request: Request, response: Response, next: NextFunction){
        try {
            const payload = request.body as PostSchema

            const createdRealEstate = await service.create(payload)
            
            return response.status(201).json(createdRealEstate)
        } catch (error) {
            return next(error)
        }
    },

    async show(request: Request, response: Response, next: NextFunction){
        try {
            const realEstateId = request.params.id

            const account = await service.findOne(realEstateId)
            
            return response.status(200).json(account)
        } catch (error) {
            return next(error)
        }
    },
}
