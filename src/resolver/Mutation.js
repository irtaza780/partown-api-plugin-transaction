import ObjectID from "mongodb";
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";
import ReactionError from "@reactioncommerce/reaction-error";
import _ from "lodash";
import validateUser from "../utils/validateUser.js";
import fundsApprovalNotification from "../utils/fundsApprovalNotification.js";

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
      let { amount, transactionType, transactionProof, bankAccountId } =
        args.input;

      let { auth, authToken, userId, collections } = context;
      let { Transactions, Accounts } = collections;

      if (!authToken || !userId) {
        return new Error("Unauthorized");
      }
      await validateUser(context, userId);

      if (transactionType === "deposit" && !transactionProof)
        return new Error("Please provide proof of transaction");

      if (transactionType === "withdraw") {
        if (!bankAccountId) {
          return new Error(
            "Bank information is required when making a withdrawal"
          );
        }

        const account = await Accounts.findOne({ _id: userId });
        console.log("account in transaction is", account);
        const userAmount = account?.wallets?.amount;
        if (userAmount < amount) {
          return new Error("Insufficient funds");
        }
        if (userAmount > amount) {
          await Accounts.updateOne(
            {
              _id: userId,
            },
            { $inc: { "wallets.amount": -amount, "wallets.escrow": amount } }
          );
        }
      }

      let userAccount = await Accounts.findOne({ userId });

      let userTransactionId = userAccount?.profile?.transactionId
        ? userAccount?.profile?.transactionId
        : "n/a";
      const createdAt = new Date();

      const timestamp = new Date().getTime();

      // Round down the timestamp to remove decimal points
      const txnReference = Math.floor(timestamp);

      let data = {
        amount,
        approvalStatus: "pending",
        transactionBy: userId,
        transactionId: userTransactionId,
        transactionType: transactionType,
        createdAt,
        updatedAt: createdAt,
        transactionProof,
        bankAccountId,
        txnReference,
      };
      let createdTransaction = await Transactions.insertOne(data);

      return { _id: createdTransaction?.insertedId, txnReference };
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
      let { transactionId, approvalStatus, transactionBy } = args;
      let { authToken, collections } = context;
      let { Transactions, Trades, Accounts } = collections;

      if (!authToken) return new Error("Unauthorized");
      console.log("input is ", args);

      let userAccount = await Accounts.findOne({
        _id: decodeOpaqueId(transactionBy).id,
      });

      let foundedTransaction = await Transactions.findOne({
        _id: ObjectID.ObjectId(transactionId),
      });

      // if (
      //   approvalStatus === "approved" &&
      //   foundedTransaction?.transactionType === "withdraw" &&
      //   userAccount?.wallets?.amount < foundedTransaction?.amount
      // ) {
      //   return new Error(
      //     "The user does not have sufficient funds to make this withdrawal"
      //   );
      // }

      if (foundedTransaction?.approvalStatus !== "pending") {
        return new Error(
          `This transaction is already ${foundedTransaction?.approvalStatus}`
        );
      }
      let decodedAccountId = decodeOpaqueId(transactionBy).id;

      console.log(
        "founded transaction is ",
        foundedTransaction?.transactionType
      );

      let transactionType = "";
      let amount = foundedTransaction?.amount;
      if (foundedTransaction?.transactionType === "deposit") {
        transactionType = "deposit";
      } else if (foundedTransaction?.transactionType === "withdraw") {
        transactionType = "withdrawal";
      }

      let approvedTransaction = await Transactions.update(
        {
          _id: ObjectID.ObjectId(transactionId),
        },
        { $set: { approvalStatus, updatedAt: new Date() } }
      );

      if (approvedTransaction?.result?.n > 0 && approvalStatus === "approved") {
        console.log("transaction type", transactionType);
        if (foundedTransaction?.transactionType === "deposit") {
          await Accounts.updateOne(
            { _id: decodedAccountId },
            { $inc: { "wallets.amount": amount } }
          );
        }
        if (foundedTransaction?.transactionType === "withdraw") {
          await Accounts.updateOne(
            { _id: decodedAccountId },
            { $inc: { "wallets.escrow": -amount } }
          );
        }
      }
      let title =
        approvalStatus === "approved"
          ? "Transaction Approved"
          : "Transaction Rejected";

      let description = "";

      if (approvalStatus === "approved") {
        description = "Congratulations, your transaction has been approved!";
      } else {
        description = "Your transaction has been rejected.";
      }

      const details = `Your request for ${transactionType} of ₦${amount} has been ${approvalStatus}`;
      if (approvedTransaction?.result?.n > 0) {
        await context.mutations.createNotification(context, {
          title,
          details,
          hasDetails: true,
          message: "",
          status: null,
          to: decodedAccountId,
          type: "transaction",
          image:
            "https://images.pexels.com/photos/3172740/pexels-photo-3172740.jpeg?cs=srgb&dl=pexels-%E6%9D%8E%E8%BF%9B-3172740.jpg&fm=jpg&w=640&h=640",
        });

        await fundsApprovalNotification(
          context,
          decodedAccountId,
          transactionType,
          approvalStatus,
          description,
          amount
        );

        return true;
      }

      return false;
    } catch (err) {
      return err;
    }
  },
  async emailBankDetails(parent, { firstName, lastName }, context, info) {
    try {
      const { authToken, userId, collections } = context;
      const { Accounts, Shops, BankInfo } = collections;

      //variables : firstName, lastName, headerMsg,
      if (!authToken || !userId)
        throw new ReactionError("not-found", "Account not found");

      const accountResult = await Accounts.findOne({ _id: userId });
      const bankDetailResult = await BankInfo.findOne({ isPlatformInfo: true });

      let decodedAccountId = decodeOpaqueId(userId).id;

      const bodyTemplate = "email/bankDetails";

      const account = await Accounts.findOne({ _id: decodedAccountId });

      if (!account) throw new ReactionError("not-found", "Account not found");

      const shop = await Shops.findOne({ shopType: "primary" });
      if (!shop) throw new ReactionError("not-found", "Shop not found");

      let email = _.get(account, "emails[0].address");

      const dataForEmail = {
        firstName: _.get(accountResult, "profile.firstName"),
        lastName: _.get(accountResult, "profile.lastName"),
        headerMsg: "Bank Details are",
        sortCode: _.get(bankDetailResult, "sortCode"),
        accountNumber: _.get(bankDetailResult, "accountNumber"),
        accountName: _.get(bankDetailResult, "accountName"),
        paymentReference: _.get(accountResult, "profile.transactionId"),
      };

      const language =
        (account.profile && account.profile.language) || shop.language;

      context.mutations.sendEmail(context, {
        data: dataForEmail,
        fromShop: shop,
        templateName: bodyTemplate,
        language,
        to: email,
      });
    } catch (err) {
      return err;
    }
  },
};
