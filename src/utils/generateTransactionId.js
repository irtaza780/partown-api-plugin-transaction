export default function generateTransactionId() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * 6));
  }
  return result;
}
