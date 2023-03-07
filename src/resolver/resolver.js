import ObjectID from "mongodb";
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";

export default {
  Mutation: {
    async makeTransaction(parent, args, context, info) {
      try {
        let { amount, transactionType } = args.input;
        let { Transactions, Accounts } = context.collections;
        let { auth, authToken, userId } = context;

        if (!authToken) {
          return {
            transactionOutput: {
              success: false,
              message: "Unauthorized",
              status: 401,
            },
          };
        }

        if (!userId) {
          return {
            transactionOutput: {
              success: false,
              message: "Unauthorized",
              status: 200,
            },
          };
        }
        let userAccount = await Accounts.findOne({ userId });
        console.log("users account is ");
        console.log(userAccount);
        let userTransactionId = userAccount?.profile?.transactionId;
        console.log("user transaction is ");
        console.log(userTransactionId);
        let data = {
          amount,
          approvalStatus: "pending",
          transactionBy: userId,
          transactionId: userTransactionId,
          transactionType: transactionType,
        };
        let createdTransaction = await Transactions.insertOne(data);
        console.log("Created transaction is ", createdTransaction);
        if (createdTransaction?.result?.n > 0) {
          return {
            success: true,
            message: "Transaction Created",
            status: 200,
          };
        } else {
          return {
            success: false,
            message: "Unable to create transaction",
            status: 200,
          };
        }
      } catch (err) {
        console.log("error is ", err);
        return {
          transactionOutput: {
            success: false,
            message: `Server Error ${err}`,
            status: 500,
          },
        };
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
    async approveTransaction(parent, args, context, info) {
      try {
        let { transactionId } = args;
        let { authToken, collections } = context;
        let { Transactions } = collections;
        if (!authToken) {
          return {
            transactionOutput: {
              success: false,
              message: "Unauthorized",
              status: 401,
            },
          };
        }

        let approvedTransaction = await Transactions.findAndUpdateOne(
          {
            _id: transactionId,
          },
          { $set: { isApproved: true } }
        );
        console.log(approvedTransaction, approvedTransaction?.result?.n);
        if (approvedTransaction?.result?.n > 0)
          return {
            transaction: approvedTransaction,
            transactionOutput: {
              success: true,
              message: "Transaction Approved",
              status: 200,
            },
          };
        else
          return {
            transactionOutput: {
              success: false,
              message: "Unable to approve transaction",
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
  },
  Query: {
    async getAllTransactions(parents, args, context, info) {
      try {
        let { collections } = context;
        let { Transactions } = collections;
        let allTransactions = await Transactions.find().toArray();
        if (allTransactions?.length) {
          return {
            transactions: allTransactions,
            response: {
              success: true,
              message: "Transactions Found",
              status: 200,
            },
          };
        } else {
          return {
            transactions: null,
            response: {
              success: false,
              message: "No Transactions Found",
              status: 200,
            },
          };
        }
      } catch (err) {
        console.log(err);
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
