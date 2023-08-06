import decodeOpaqueId from "@reactioncommerce/api-utils/decodeOpaqueId.js";
import getPaginatedResponse from "@reactioncommerce/api-utils/graphql/getPaginatedResponse.js";
import wasFieldRequested from "@reactioncommerce/api-utils/graphql/wasFieldRequested.js";
import _ from "lodash";

export default {
  async getAllTransactions(parents, args, context, info) {
    try {
      const { collections } = context;
      const { filters, searchQuery, ...connectionArgs } = args;

      let { Transactions } = collections;

      let filter = {
        transactionType: { $ne: null, $exists: true },
      };

      if (filters && filters.sortByType) {
        filter.transactionType = filters.sortByType;
      }

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
      const { filters, searchQuery, accountId, ...connectionArgs } = args;
      let idToUse = userId;
      if (accountId) {
        idToUse = decodeOpaqueId(accountId).id;
      }

      let { Transactions } = collections;

      let filter = {
        transactionBy: idToUse,
        tradeTransactionType: { $ne: null, $exists: true },
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
  async getTradesHistory(parents, args, context, info) {
    try {
      const { userId, authToken, collections } = context;
      const { Transactions, Catalog } = collections;

      if (!userId || !authToken) return new Error("Unauthorized");

      let matchStage = [];

      matchStage.push({ transactionBy: userId });
      matchStage.push({
        $or: [
          { transactionType: { $exists: false } },
          { transactionType: null },
        ],
      });

      const {
        searchQuery,
        location,
        propertySaleType,
        propertyType,
        ...connectionArgs
      } = args;

      if (searchQuery) {
        // Add the condition for searchQuery
        matchStage.push({
          productId: {
            $in: await Catalog.distinct("product._id", {
              $or: [
                {
                  "product.title": {
                    $regex: new RegExp(searchQuery, "i"),
                  },
                },
                {
                  "product.slug": {
                    $regex: new RegExp(searchQuery, "i"),
                  },
                },
                {
                  "product.location.country": {
                    $regex: new RegExp(searchQuery, "i"),
                  },
                },
                {
                  "product.location.state": {
                    $regex: new RegExp(searchQuery, "i"),
                  },
                },
                {
                  "product.location.location": {
                    $regex: new RegExp(searchQuery, "i"),
                  },
                },
                {
                  "product.propertyType": {
                    $regex: new RegExp(searchQuery, "i"),
                  },
                },
              ],
            }),
          },
        });
      }

      if (location?.length) {
        matchStage.push({
          productId: {
            $in: await Catalog.distinct("product._id", {
              "product.location.state": { $in: location },
            }),
          },
        });
      }

      if (propertyType?.length) {
        matchStage.push({
          productId: {
            $in: await Catalog.distinct("product._id", {
              "product.propertyType": { $in: propertyType },
            }),
          },
        });
      }

      if (propertySaleType) {
        matchStage.push({
          productId: {
            $in: await Catalog.distinct("product._id", {
              "product.propertySaleType.type": propertySaleType,
            }),
          },
        });
      }

      const tradeHistory = Transactions.find({ $and: matchStage });

      return getPaginatedResponse(tradeHistory, connectionArgs, {
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
};
