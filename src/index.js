import importAsString from "@reactioncommerce/api-utils/importAsString.js";

const mySchema = importAsString("./schema.graphql");

export default async function register(app) {
  await app.registerPlugin({
    label: "Product Dimensions",
    name: "products-dimensions",
    version: "1.0",
    functionsByType: {
      startup: [myStartup],
      publishProductToCatalog: [myPublishProductToCatalog],
    },
    graphQL: {
      schemas: [mySchema],
    },
  });
}
