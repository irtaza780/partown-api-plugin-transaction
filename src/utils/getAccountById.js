/**
 *
 * @method placeBidOnProduct
 * @summary Get all of a Unit's Variants or only a Unit's top level Variants.
 * @param {Object} context - an object containing the per-request state
 * @param {String} unitOrVariantId - A Unit or top level Unit Variant ID.
 * @param {Boolean} topOnly - True to return only a units top level variants.
 * @param {Object} args - an object of all arguments that were sent by the client
 * @param {Boolean} args.shouldIncludeHidden - Include hidden units in results
 * @param {Boolean} args.shouldIncludeArchived - Include archived units in results
 * @returns {Promise<Object[]>} Array of Unit Variant objects.
 */
import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";

export default async function getAccountById(context, accountId) {
  console.log("firing get accounts util function");
  const { collections } = context;
  const { Accounts } = collections;
  let accountResponse = await Accounts.findOne({
    _id: decodeOpaqueId(accountId).id,
  });
  return accountResponse;
}
