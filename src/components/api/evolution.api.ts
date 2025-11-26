export const sendTextMessage = async (phoneNumber: string, message: string) => {
  return await fetch(
    "https://evolution-api-production-9f1e.up.railway.app/message/sendText/meu controle ia",
    {
      method: "POST",
      headers: {
        apikey: "EE68EB9F982D-4097-B4F6-D2C4CD8ED154",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message,
      }),
    }
  );
};
