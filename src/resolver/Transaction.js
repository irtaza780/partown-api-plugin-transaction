import getAccountById from "../utils/getAccountById.js";
import getProductById from "../utils/getProductById.js";

export default {
  async transactionByInfo(parent, args, context, info) {
    let transactionByInfo = await getAccountById(context, parent.transactionBy);

    return transactionByInfo;
  },
  async tradeByInfo(parent, args, context, info) {
    let tradeByInfo = await getAccountById(context, parent.tradeBy);
    return tradeByInfo;
  },
  async productInfo(parent, args, context, info) {
    let productInfo = await getProductById(context, parent.productId);
    return productInfo;
  },
};
