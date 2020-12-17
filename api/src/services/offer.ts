import hyperledgerFabric from "../lib/hyperledger-fabric";
import parser from "../lib/parser";
import logger from "../lib/logger";

import { PostSchema } from "../schemas/offer";

export default {
  async create(payload: PostSchema) {
    try {
      logger.info({
        message: "Starting to create offer...",
      });

      const contract = await hyperledgerFabric.getContract();

      const payloadAsString = parser.JSONToString(payload);

      const offerAsBuffer = await contract.submitTransaction(
        "createOffer",
        payloadAsString
      );

      const createdOffer = parser.bufferToJSON(offerAsBuffer);

      logger.info({
        message: "Successfully created offer",
      });

      return createdOffer;
    } catch (error) {
      logger.error({
        message: "Failed to persist offer on blockchain",
        error_message: error.message,
        error_stack: error.stack,
      });

      throw error;
    }
  },

  async findOne(offerId: string) {
    try {
      const contract = await hyperledgerFabric.getContract();

      const offerAsBuffer = await contract.evaluateTransaction(
        "getAssetById",
        offerId
      );

      const offer = JSON.parse(offerAsBuffer.toString());

      return offer;
    } catch (error) {
      logger.error({
        message: "Failed to find real estate on blockchain",
        error_message: error.message,
        error_stack: error.stack,
      });

      throw error;
    }
  },

  async addSignature(offerId: string, signee: string) {
    try {
      logger.info({
        message: "Adding signature...",
      });

      const contract = await hyperledgerFabric.getContract();


      const signatureMethod = signee === 'buyer' ? 'addBuyerSignatureToOffer' : 'addSellerSignatureToOffer' 

      const signedOfferAsBuffer = await contract.submitTransaction(
        signatureMethod,
        offerId,
      );

      const signedOffer = parser.bufferToJSON(signedOfferAsBuffer);

      logger.info({
        message: "Successfully added signature",
      });

      return signedOffer;
    } catch (error) {
      logger.error({
        message: "Failed to add signature on blockchain",
        error_message: error.message,
        error_stack: error.stack,
      });

      throw error;
    }
  },
};
