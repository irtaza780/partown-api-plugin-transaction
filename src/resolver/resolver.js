import ObjectID from "mongodb";
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";

console.log("object id is ");
console.log(ObjectID);

export const resolver = {
  Mutation: {
    async createTransaction(parent, args, context, info) {
      try {
        console.log("args are ");
        console.log(args);
        console.log("success");
      } catch (err) {
        console.log("error is ", err);
      }
    },
  },
};
