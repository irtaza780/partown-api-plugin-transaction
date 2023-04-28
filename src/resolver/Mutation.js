import ObjectID from "mongodb";
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";

import _ from "lodash";
import validateUser from "../utils/validateUser.js";

function generateTransactionId() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * 10));
  }
  return result;
}

export default {
  async makeTransaction(parent, args, context, info) {
    try {
      let { amount, transactionType } = args.input;

      let { auth, authToken, userId, collections } = context;
      let { Transactions, Accounts } = collections;

      if (!authToken || !userId) {
        return new Error("Unauthorized");
      }
      await validateUser(context, userId);

      let userAccount = await Accounts.findOne({ userId });

      let userTransactionId = userAccount?.profile?.transactionId
        ? userAccount?.profile?.transactionId
        : "n/a";
      const createdAt = new Date();
      let data = {
        amount,
        approvalStatus: "pending",
        transactionBy: userId,
        transactionId: userTransactionId,
        transactionType: transactionType,
        createdAt,
        updatedAt: createdAt,
      };
      let createdTransaction = await Transactions.insertOne(data);

      return { _id: createdTransaction?.insertedId };
    } catch (err) {
      return err;
    }
  },
  async deleteTransaction(parent, args, context, info) {
    try {
      let { transactionId } = args;
      let { authToken, collections } = context;
      let { Transactions } = collections;
      // let decodedProductId = decodeOpaqueId(productId)?.id
      if (!authToken) {
        return {
          transactionOutput: {
            success: false,
            message: "Unauthorized",
            status: 401,
          },
        };
      }
      let data = {
        _id: ObjectID.ObjectId(transactionId),
      };

      let updatedTransaction = await Transactions.remove(data);
      console.log(
        "deletedLicense",
        deletedTransaction,
        deletedTransaction?.result?.n
      );
      if (deletedTransaction?.result?.n > 0)
        return {
          transactionOutput: {
            success: true,
            message: "Successfully Deleted",
            status: 200,
          },
        };
      else
        return {
          transactionOutput: {
            success: false,
            message: "Unable to delete",
            status: 200,
          },
        };
    } catch (err) {
      return {
        transactionOutput: {
          success: false,
          message: `Server Error ${err}`,
          status: 500,
        },
      };
    }
  },
  async updateTransactionStatus(parent, args, context, info) {
    try {
      let { transactionId, approvalStatus } = args;
      let { authToken, collections } = context;
      let { Transactions, Trades } = collections;

      if (!authToken) return new Error("Unauthorized");
      console.log("input is ", args);

      let foundedTransaction = await Transactions.findOne({
        _id: ObjectID.ObjectId(transactionId),
      });

      if (foundedTransaction?.approvalStatus !== "pending") {
        return new Error(
          `This transaction is already ${foundedTransaction?.approvalStatus}`
        );
      }

      let approvedTransaction = await Transactions.update(
        {
          _id: ObjectID.ObjectId(transactionId),
        },
        { $set: { approvalStatus, updatedAt: new Date() } }
      );

      if (approvedTransaction?.result?.n > 0) return true;

      return false;
    } catch (err) {
      return err;
    }
  },
};
