import { Request, Response, NextFunction } from 'express'

import service from '../services/offer'
import { PostSchema } from '../schemas/offer'

export default {
    async create(request: Request, response: Response, next: NextFunction){
        try {
            const payload = request.body as PostSchema

            const createdOffer = await service.create(payload)
            
            return response.status(201).json(createdOffer)
        } catch (error) {
            return next(error)
        }
    },

    async show(request: Request, response: Response, next: NextFunction){
        try {
            const offerId = request.params.id

            const offer = await service.findOne(offerId)
            
            return response.status(200).json(offer)
        } catch (error) {
            return next(error)
        }
    },

    async addSignature(request: Request, response: Response, next: NextFunction){
        try {
            const offerId = request.params.id
            const signee = request.body.signee as string

            const signedOffer = await service.addSignature(offerId, signee)
            
            return response.status(200).json(signedOffer)
        } catch (error) {
            return next(error)
        }
    },
}
