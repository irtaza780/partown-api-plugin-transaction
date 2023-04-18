import ObjectID from "mongodb";
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";
import getPaginatedResponse from "@reactioncommerce/api-utils/graphql/getPaginatedResponse.js";
import wasFieldRequested from "@reactioncommerce/api-utils/graphql/wasFieldRequested.js";

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
  Mutation: {
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

        console.log("decoded id is ", decodeOpaqueId(transactionId).id);
        let foundedTransaction = await Transactions.findOne({
          transactionId,
        });

        console.log("founded transaction id is", foundedTransaction);

        let approvedTransaction = await Transactions.update(
          {
            transactionId,
          },
          { $set: { approvalStatus, updatedAt: new Date() } }
        );
        console.log("approved transaction is ", approvedTransaction);
        if (approvedTransaction?.result?.n > 0) return true;

        return new Error("not updated");
      } catch (err) {
        return err;
      }
    },
  },
  Query: {
    async getAllTransactions(parents, args, context, info) {
      try {
        const { collections } = context;
        const { filters, searchQuery, ...connectionArgs } = args;

        let { Transactions } = collections;

        let filter = {
          transactionType: { $ne: null, $exists: true },
        };
        if (searchQuery) {
          filter.$or = [
            {
              transactionId: {
                $regex: new RegExp(searchQuery, "i"),
              },
            },
          ];
        }

        const transactions = Transactions.find(filter);

        console.log("transactions are ", transactions);

        // return transactions;
        return getPaginatedResponse(transactions, connectionArgs, {
          includeHasNextPage: wasFieldRequested("pageInfo.hasNextPage", info),
          includeHasPreviousPage: wasFieldRequested(
            "pageInfo.hasPreviousPage",
            info
          ),
          includeTotalCount: wasFieldRequested("totalCount", info),
        });
      } catch (err) {
        return err;
      }
    },
    async getAllTradeTransactions(parents, args, context, info) {
      try {
        const { collections, userId } = context;
        const { filters, accountId } = args;
        let idToUse = userId;
        if (accountId) {
          idToUse = decodeOpaqueId(accountId).id;
        }
        const sortBy = _.get(filters, "sortBy");

        let { Transactions } = collections;

        let filter = {
          transactionBy: idToUse,
          tradeTransactionType: { $ne: null, $exists: true },
        };

        if (sortBy) {
          filter.tradeTransactionType = sortBy;
        }

        const transactions = await Transactions.find(filter, {})
          .sort({ createdAt: -1 })
          .toArray();

        return transactions;
      } catch (err) {
        return err;
      }
    },
    async userTransactions(parents, args, context, info) {
      try {
        let { authToken, userId, collections } = context;

        let { Transactions } = collections;
        console.log("user id is ", userId);
        if (!authToken) return new Error("Unauthorized");

        let userTransactions = await Transactions.find({
          transactionBy: userId,
          approvalStatus: "approved",
        }).toArray();

        console.log("user transactions are");
        console.log(userTransactions);
        return userTransactions;
      } catch (err) {
        return err;
      }
    },
  },
};
