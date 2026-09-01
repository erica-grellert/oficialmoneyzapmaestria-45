export const sendTextMessage = async (phoneNumber: string, message: string) => {
  return await fetch(
    "https://evolution-api-production-9f1e.up.railway.app/message/sendText/MeuControleIA",
    {
      method: "POST",
      headers: {
        apikey: "51B6C739EA8C-41B4-BA76-16AC4DF80742",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message,
      }),
    }
  );
};
