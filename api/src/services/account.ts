import hyperledgerFabric from "../lib/hyperledger-fabric";
import parser from "../lib/parser";
import logger from "../lib/logger";

import { PostSchema } from "../schemas/account";

export default {
  async create(payload: PostSchema) {
    try {
      logger.info({
        message: "Starting to create account...",
      });

      const contract = await hyperledgerFabric.getContract();

      const payloadAsString = parser.JSONToString(payload);

      const accountAsBuffer = await contract.submitTransaction(
        "createAccount",
        payloadAsString
      );

      const createdAccount = parser.bufferToJSON(accountAsBuffer);

      logger.info({
        message: "Successfully created account",
      });

      return createdAccount;
    } catch (error) {
      logger.error({
        message: "Failed to persist account on blockchain",
        error_message: error.message,
        error_stack: error.stack,
      });

      throw error;
    }
  },

  async findOne(accountId: string) {
    try {
      const contract = await hyperledgerFabric.getContract();

      const accountAsBuffer = await contract.evaluateTransaction(
        "getAssetById",
        accountId
      );

      const account = JSON.parse(accountAsBuffer.toString());

      return account;
    } catch (error) {
      logger.error({
        message: "Failed to find account on blockchain",
        error_message: error.message,
        error_stack: error.stack,
      });

      throw error;
    }
  },

  async deposit(accountId: string, amount: number) {
    try {
      logger.info({
        message: "Starting to process deposit...",
      });

      const contract = await hyperledgerFabric.getContract();

      const accountAsBuffer = await contract.submitTransaction(
        "depositToAccount",
        accountId,
        amount.toString()
      );

      const createdAccount = parser.bufferToJSON(accountAsBuffer);

      logger.info({
        message: "Successfully made deposit to account",
      });

      return createdAccount;
    } catch (error) {
      logger.error({
        message: "Failed to process deposit on blockchain",
        error_message: error.message,
        error_stack: error.stack,
      });

      throw error;
    }
  },

};
