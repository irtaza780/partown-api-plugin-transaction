import _ from "lodash";
import ReactionError from "@reactioncommerce/reaction-error";

async function sendEmailNotification(
  context,
  email,
  firstName,
  lastName,
  transactionType,
  approvalStatus,
  description,
  amount
) {
  const bodyTemplate = "funds/approval";

  const currentYear = new Date().getFullYear();

  const facebook = process.env.FACEBOOK;
  const instagram = process.env.INSTAGRAM;
  const twitter = process.env.TWITTER;

  const transactionHistoryLink = `${process.env.CLIENT_URL}/dashboard/accounthistory`;

  const dataForEmail = {
    currentYear,
    firstName,
    lastName,
    transactionType,
    approvalStatus,
    description,
    amount,
    facebook,
    instagram,
    twitter,
    transactionHistoryLink,
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
  transactionType,
  approvalStatus,
  description,
  amount
) {
  const {
    collections: { Accounts },
  } = context;

  const account = await Accounts.findOne({ _id: userId });

  //destructuring account info
  let email = _.get(account, "emails[0].address");

  let firstName = _.get(account, "profile.firstName");
  let lastName = _.get(account, "profile.lastName");

  const hasEnabledEmailNotification = _.get(
    account,
    "userPreferences.contactPreferences.email"
  );
  const hasEnabledSMSNotification = _.get(
    account,
    "userPreferences.contactPreferences.sms"
  );
  if (hasEnabledEmailNotification) {
    await sendEmailNotification(
      context,
      email,
      firstName,
      lastName,
      transactionType,
      approvalStatus,
      description,
      amount
    );
  }

  if (hasEnabledSMSNotification) {
    console.log("sms notification");
  }

  return true;
}
