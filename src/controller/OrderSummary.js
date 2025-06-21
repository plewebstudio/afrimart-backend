// Helper function to share the spreadsheet with a specified email address
const { google } = require("googleapis");
const Order = require("../model/Order");
const path = require("path");

// Set up authentication with your service account including Drive scope
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.SPREADSHEET_API_TYPE,
    project_id: process.env.SPREADSHEET_API_PROJECT_ID,
    private_key_id: process.env.SPREADSHEET_API_PRIVATE_KEY_ID,
    private_key: process.env.SPREADSHEET_API_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.SPREADSHEET_API_CLIENT_EMAIL,
    client_id: process.env.SPREADSHEET_API_CLIENT_ID,
    auth_uri: process.env.SPREADSHEET_API_AUTH_URI,
    token_uri: process.env.SPREADSHEET_API_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.SPREADSHEET_API_AUTH_PROVIDER_x509_CERT_URL,
    client_x509_cert_url: process.env.SPREADSHEET_API_client_x509_cert_url,
    universe_domain: process.env.SPREADSHEET_API_UNIVERSE_DOMAIN,
  }, // Absolute path relative to the current file
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive", // Needed for sharing
  ],
});

// Helper function with retry logic for sharing the spreadsheet
async function shareSpreadsheet(spreadsheetId, email, retries = 3) {
  const drive = google.drive({ version: "v3", auth });
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: "writer", // Use "reader" if you want view-only access
          type: "user",
          emailAddress: email,
        },
      });
      console.log("Spreadsheet shared successfully.");
      return; // Exit function on success
    } catch (error) {
      // Check if error is a rate limit error for sharing
      if (
        error.response &&
        error.response.data &&
        error.response.data.error &&
        error.response.data.error.errors &&
        error.response.data.error.errors.some(
          (err) => err.reason === "sharingRateLimitExceeded"
        )
      ) {
        console.warn(
          `Sharing rate limit exceeded. Attempt ${attempt} of ${retries}. Retrying...`
        );
        // Exponential backoff delay: 2^attempt * 1000 ms
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
        continue; // Retry the operation
      }
      // If not a rate limit error, rethrow the error
      throw error;
    }
  }
  throw new Error(
    "Exceeded maximum retry attempts for sharing the spreadsheet."
  );
}

exports.createOrderSummary = async (req, res) => {
  try {
    // Define the start and end of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch today’s orders
    const orders = await Order.find({
      created_at: { $gte: startOfDay, $lte: endOfDay },
    });
    console.log("Orders found:", orders); // Debug log

    // Prepare the data summary with a header row
    const header = [
      "Customer Name",
      "Amount Paid (€)",
      "Payment Method",
      "Order Status",
      "Number of Items",
      "Created At",
    ];
    const dataRows = orders.map((order) => [
      order.customer_name,
      order.amount_paid,
      order.payment_method,
      order.order_status,
      order.order_items.length,
      order.created_at.toISOString(),
    ]);
    const values = [header, ...dataRows];

    // Create a new spreadsheet with today's date in the title
    const sheets = google.sheets({ version: "v4", auth });
    const createResponse = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: `Order Summary - ${new Date().toLocaleDateString()}`,
        },
        sheets: [
          {
            properties: {
              title: "Summary",
            },
          },
        ],
      },
    });
    const newSpreadsheetId = createResponse.data.spreadsheetId;

    // Write the summary data to the new spreadsheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: newSpreadsheetId,
      range: "Summary!A1",
      valueInputOption: "USER_ENTERED",
      resource: { values },
    });

    // Share the spreadsheet with your email (update with your actual email address)
    await shareSpreadsheet(newSpreadsheetId, "africanmarketlithuania@gmail.com");

    // Respond with the new spreadsheet URL and ID
    res.status(200).json({
      message: "Order summary created and shared successfully",
      spreadsheetId: newSpreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`,
    });
  } catch (error) {
    console.error("Error creating order summary:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};
