import getAccountById from "../utils/getAccountById";
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";
export default {
  async transactionByInfo(parent, args, context, info) {
    console.log("firing transaction by info function", transactionByInfo);
    let transactionByInfo = await getAccountById(context, parent.transactionBy);
    console.log("transaction by info", transactionByInfo);
    return transactionByInfo;
  },
};
