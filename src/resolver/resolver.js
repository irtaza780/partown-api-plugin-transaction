import ObjectID from "mongodb";
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";

console.log("object id is ");
console.log(ObjectID);

export default {
  Mutation: {
    async makeTransaction(parent, args, context, info) {
      try {
        let { amount } = args.input;
        let { Transactions } = context.collections;
        console.log("collections are ");
        console.log(context.collections);
        console.log("transactions are ");
        console.log(Transactions);
        let createdTransaction = await Transactions.insertOne({ amount });
        console.log("Created transaction is ", createdTransaction);
        return {
          success: true,
          message: "Transaction Created",
          status: 200,
        };
      } catch (err) {
        console.log("error is ", err);
        return {
          success: false,
          message: `Server Error ${err}`,
          status: 500,
        };
      }
    },
  },
};
