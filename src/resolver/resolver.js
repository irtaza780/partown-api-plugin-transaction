import ObjectID from "mongodb";
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";

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
        let { Transactions, Accounts } = context.collections;
        let { auth, authToken, userId } = context;

        if (!authToken || !userId) {
          return new Error("Unauthorized");
        }

        let userAccount = await Accounts.findOne({ userId });

        let userTransactionId = userAccount?.profile?.transactionId;

        let data = {
          amount,
          approvalStatus: "pending",
          transactionBy: userId,
          transactionId: generateTransactionId(),
          transactionType: transactionType,
        };
        let createdTransaction = await Transactions.insertOne(data);

        console.log("created transaction is ", createdTransaction);

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
          { $set: { approvalStatus } }
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
        let { collections } = context;
        let { Transactions } = collections;
        const transactions = await Transactions.find().toArray();
        console.log("transactions are ", transactions);

        return transactions;
      } catch (err) {
        return err;
      }
    },
    async getUserTransactions(parents, args, context, info) {
      try {
        let { auth, authToken, userId, collections } = context;
        let { Transactions } = collections;

        if (!authToken) {
          return {
            transactions: null,
            response: {
              success: false,
              message: "Unauthorized",
              status: 401,
            },
          };
        }
        let userTransactions = await Transactions.find({
          transactionBy: userId,
        }).toArray();
        console.log("user transactions are");
        console.log(userTransactions);
        if (userTransactions?.length) {
          return {
            transactions: userTransactions,
            response: {
              success: true,
              message: "Transactions Found",
              status: 200,
            },
          };
        } else {
          return {
            transactions: userTransactions,
            response: {
              success: false,
              message: "No Transactions Found",
              status: 200,
            },
          };
        }
      } catch (err) {
        return {
          transactions: null,
          response: {
            success: false,
            message: `Server Error ${err}`,
            status: 500,
          },
        };
      }
    },
  },
};
