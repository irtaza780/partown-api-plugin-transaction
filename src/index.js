import { createRequire } from "module";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Mutation from "./resolver/Mutation.js";
import Query from "./resolver/Query.js";
import Transaction from "./resolver/Transaction.js";
const schemas = importAsString("./schema/schema.graphql");
const require = createRequire(import.meta.url);
const pkg = require("../package.json");
import mutations from "./mutations/index.js";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {Object} app The ReactionAPI instance
 * @returns {undefined}
 */

const resolvers = {
  Mutation,
  Query,
  Transaction
};

export default async function register(app) {
  await app.registerPlugin({
    label: pkg.label,
    name: pkg.name,
    version: pkg.version,
    collections: {
      Transactions: {
        name: "Transactions",
        updatedAt: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
      },
    },
    graphQL: {
      schemas: [schemas],
      resolvers,
    },
    mutations,
  });
}
