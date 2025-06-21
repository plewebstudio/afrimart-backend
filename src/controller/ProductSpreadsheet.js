// productController.js
const { google } = require("googleapis");
const Product = require("../model/Product");

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
    auth_provider_x509_cert_url: process.env.SPREADSHEET_API_AUTH_PROVIDER_x509_CERT_URL,
    client_x509_cert_url: process.env.SPREADSHEET_API_CLIENT_X509_CERT_URL,
    universe_domain: process.env.SPREADSHEET_API_UNIVERSE_DOMAIN,
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
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
          role: "writer",
          type: "user",
          emailAddress: email,
        },
      });
      console.log("Spreadsheet shared successfully.");
      return;
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.error &&
        error.response.data.error.errors &&
        error.response.data.error.errors.some((err) => err.reason === "sharingRateLimitExceeded")
      ) {
        console.warn(`Sharing rate limit exceeded. Attempt ${attempt} of ${retries}. Retrying...`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Exceeded maximum retry attempts for sharing the spreadsheet.");
}

exports.exportProducts = async (req, res) => {
  try {
    // Get filter from query parameter. Default to "all" if not provided.
    const filter = req.query.filter || "all";
    let query = {};

    // Define filter criteria
    if (filter === "new") {
      // Define new products as those created in the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query = { createdAt: { $gte: sevenDaysAgo } };
    } else if (filter === "low") {
      // Low stock products: threshold set to less than 10 units
      query = { StockQuantity: { $lt: 10 } };
    }
    // For "all", no filter is applied

    // Fetch the products based on the filter
    const products = await Product.find(query).populate("category");

    // Prepare the spreadsheet data
    const header = ["Product ID", "Name", "Category", "Base Price (€)", "Stock Quantity", "Created At"];
    const dataRows = products.map((product) => [
      product._id.toString(),
      product.name,
      product.category ? product.category.name : "Uncategorized",
      product.BasePrice.toFixed(2),
      product.StockQuantity,
      product.createdAt.toISOString(),
    ]);
    const values = [header, ...dataRows];

    // Create a new spreadsheet with a title that includes the current date and filter
    const sheets = google.sheets({ version: "v4", auth });
    const createResponse = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: `Product Export - ${new Date().toLocaleDateString()} - Filter: ${filter}`,
        },
        sheets: [
          {
            properties: {
              title: "Products",
            },
          },
        ],
      },
    });
    const newSpreadsheetId = createResponse.data.spreadsheetId;

    // Write the data to the newly created spreadsheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: newSpreadsheetId,
      range: "Products!A1",
      valueInputOption: "USER_ENTERED",
      resource: { values },
    });

    // Share the spreadsheet (update the email as needed)
    await shareSpreadsheet(newSpreadsheetId, "africanmarketlithuania@gmail.com");

    // Return the spreadsheet details in the response
    res.status(200).json({
      message: "Products exported successfully",
      spreadsheetId: newSpreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`,
    });
  } catch (error) {
    console.error("Error exporting products:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};
