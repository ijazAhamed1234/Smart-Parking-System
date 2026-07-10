const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Your Twilio credentials
const accountSid = "AC63bd8d833a8bd85bd9a0589839538bf3";
const authToken = "e0c1578fc2037453843348e01454c02c";

const client = twilio(accountSid, authToken);

// 📩 SEND WHATSAPP MESSAGE
app.post("/send-message", async (req, res) => {
  const { phone, variables } = req.body;

  try {
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? `+${cleanPhone}` : `+91${cleanPhone}`;

    await client.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${formattedPhone}`,
      contentSid: "HXb5b62575e6e4ff6129ad7c8efe1f983e",
      contentVariables: JSON.stringify(variables || {})
    });

    console.log(`Template message sent to ${formattedPhone}`);
    res.send("Message sent");
  } catch (error) {
    console.error("Twilio Error:", error);
    res.status(500).send("Error sending message");
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Twilio Notification Server running on port ${PORT}`);
});
