import hyperledgerFabric from "../lib/hyperledger-fabric";
import parser from "../lib/parser";
import logger from "../lib/logger";

import { PostSchema } from "../schemas/real-estate";

export default {
  async create(payload: PostSchema) {
    try {
      logger.info({
        message: "Starting to create real estate...",
      });

      const contract = await hyperledgerFabric.getContract();

      const payloadAsString = parser.JSONToString(payload);

      const realEstateAsBuffer = await contract.submitTransaction(
        "createRealEstate",
        payloadAsString
      );

      const createdAccount = parser.bufferToJSON(realEstateAsBuffer);

      logger.info({
        message: "Successfully created real estate",
      });

      return createdAccount;
    } catch (error) {
      logger.error({
        message: "Failed to persist real estate on blockchain",
        error_message: error.message,
        error_stack: error.stack,
      });

      throw error;
    }
  },

  async findOne(realEstateId: string) {
    try {
      const contract = await hyperledgerFabric.getContract();

      const realEstateAsBuffer = await contract.evaluateTransaction(
        "getAssetById",
        realEstateId
      );

      const realEstate = JSON.parse(realEstateAsBuffer.toString());

      return realEstate;
    } catch (error) {
      logger.error({
        message: "Failed to find real estate on blockchain",
        error_message: error.message,
        error_stack: error.stack,
      });

      throw error;
    }
  },
};
