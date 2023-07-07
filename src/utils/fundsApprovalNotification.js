import _ from "lodash";
import ReactionError from "@reactioncommerce/reaction-error";

async function sendEmailNotification(
  context,
  email,
  messageHeader,
  messageBody
) {
  const bodyTemplate = "generic/template";

  const dataForEmail = {
    messageHeader,
    messageBody,
  };

  const {
    collections: { Shops },
  } = context;

  const shop = await Shops.findOne({ shopType: "primary" });
  if (!shop) throw new ReactionError("not-found", "Shop not found");

  const language = shop.language;

  return context.mutations.sendEmail(context, {
    data: dataForEmail,
    fromShop: shop,
    templateName: bodyTemplate,
    language,
    to: email,
  });
}

export default async function fundsApprovalNotification(
  context,
  userId,
  messageHeader,
  messageBody
) {
  const {
    collections: { Accounts },
  } = context;

  const account = await Accounts.findOne({ _id: userId });

  //destructuring account info
  let email = _.get(account, "emails[0].address");

  const hasEnabledEmailNotification = _.get(
    account,
    "userPreferences.contactPreferences.email"
  );
  const hasEnabledSMSNotification = _.get(
    account,
    "userPreferences.contactPreferences.sms"
  );
  if (hasEnabledEmailNotification) {
    console.log("email notification");
    await sendEmailNotification(context, email, messageHeader, messageBody);
  }

  if (hasEnabledSMSNotification) {
    console.log("sms notification");
  }

  return true;
}
