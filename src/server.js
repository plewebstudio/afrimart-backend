const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { handleWebhook } = require("./webhook");
const bodyParser = require("body-parser");
const connectDb = require("./db/database");

const Auth = require("./routes/Auth");
const Category = require("./routes/Category");
const Product = require("./routes/Product");
const Payment = require("./routes/Payment");
const Wishlist = require("./routes/WishList");
const BestSeller = require("./routes/BestSeller");
const Review = require("./routes/Review");
const Like = require("./routes/Like");
const Search = require("./routes/Search");
const Order = require("./routes/Order");
const Admin = require("./routes/Admin");
const OrderSummary = require("./routes/OrderSummary");
const AdminReview = require("./routes/AdminReview");
const ProductSpreadsheet = require("./routes/ProductSpreadsheet");

const main = async () => {
  const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5501",
    "http://127.0.0.1:5502",
    "http://localhost:8080",
    "https://afrimart-admin.vercel.app",
    "https://afrimart-owner.vercel.app",
    "https://afrimart-client.vercel.app",
    "https://afrimart-client-v2.vercel.app",
    "https://africanmarkets.eu",
    "https://admin.africanmarkets.eu",
    "https://owner.africanmarkets.eu"
  ];
  const app = express();

  // Handle OPTIONS requests
  //app.options("*", cors());
  // Replace app.options("*", cors()) with:
  // app.options("*", (req, res) => {
  //   res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  //   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  //   res.setHeader(
  //     "Access-Control-Allow-Headers",
  //     "Content-Type, Authorization"
  //   );
  //   res.status(204).send();
  // });

  // Update CORS configuration to:
  // app.use(
  //   cors({
  //     origin: allowedOrigins,
  //     methods: ["GET", "POST", "PUT", "DELETE"],
  //     allowedHeaders: ["Content-Type", "Authorization"],
  //     credentials: true,
  //     preflightContinue: false, // Add this
  //     optionsSuccessStatus: 204, // Add this
  //   })
  // );

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: "GET,POST,PUT,DELETE",
      allowedHeaders: ["Content-Type", "Authorization"], // Use an array for headers
      credentials: true, // Optional: Allow cookies/authentication headers
    })
  );

  app.options("*", cors());
  app.use(express.json());
  app.use(cookieParser());

  app.post(
    "/stripe-checkout",
    bodyParser.raw({ type: "application/json" }),
    handleWebhook
  );

  connectDb();

  app.use("/api/v1/auth", Auth);
  app.use("/api/v1/category", Category);
  app.use("/api/v1/product", Product);
  app.use("/api/v1/payment", Payment);
  app.use("/api/v1/wishlist", Wishlist);
  app.use("/api/v1/bestseller", BestSeller);
  app.use("/api/v1/review", Review);
  app.use("/api/v1/like", Like);
  app.use("/api/v1/search", Search);
  app.use("/api/v1/order", Order);
  app.use("/api/v1/admin", Admin);
  app.use("/api/v1/order-summary", OrderSummary);
  app.use("/api/v1/admin-review", AdminReview);
  app.use("/api/v1/product-spread", ProductSpreadsheet);

  const port = 8000;
  const server = app.listen(port, () => {
    console.log(`server running on localhost:${port}`);
  });

  const { spawn } = require("child_process");

  process.on("unhandledRejection", (err) => {
    if (err) {
      console.error("Unhandled rejection:", err);
    }

    console.log("Restarting server...");
    server.close(() => {
      spawn(process.argv[0], process.argv.slice(1), {
        stdio: "inherit",
        detached: true,
      }).unref();
      process.exit(1);
    });
  });
};

main().catch((error) => {
  console.log(error);
});
