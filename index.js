import { myStartup } from "./src/startup";


function myPublishProductToCatalog(
  catalogProduct,
  { context, product, shop, variants }
) {
  catalogProduct.variants &&
    catalogProduct.variants.map((catalogVariant) => {
      const productVariant = variants.find(
        (variant) => variant._id === catalogVariant.variantId
      );
      catalogVariant.volume = productVariant.volume || null;
    });
}

export default async function register(app) {
  await app.registerPlugin({
    label: "Product Dimensions",
    name: "products-dimensions",
    version: "1.0",
    functionsByType: {
      startup: [myStartup],
      publishProductToCatalog: [myPublishProductToCatalog],
    },
  });
}
