const path = require("path");
const dotenv = require("dotenv");
//dotenv.config();
dotenv.config({ path: path.resolve(__dirname, ".env") });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.payment = async (req, res) => {
  try {
    console.log(req.body);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      line_items: req.body.items.map((item) => ({
        price_data: {
          currency: item.currency,
          product_data: {
            name: item.name,
            images: item.images || [],
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),

      mode: "payment",
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: [],
      },

      shipping_options: [
        {
          shipping_rate_data: {
            display_name: req.body.shippingMethod || "Standard Shipping",
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.max(0, Number(req.body.shippingFee || 0)) * 100, // Ensure valid number
              currency: req.body.currency || "usd",
            },
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: Math.max(
                  1,
                  req.body.deliveryEstimate?.minimum?.value ?? 1
                ), // Ensures at least 1
              },
              maximum: {
                unit: "business_day",
                value: Math.max(
                  1,
                  req.body.deliveryEstimate?.maximum?.value ?? 3
                ), // Ensures at least 1
              },
            },
          },
        },
      ],
      expand: ["line_items"],
      success_url: `https://www.africanmarkets.eu/public/success.html`,
      cancel_url: `https://www.africanmarkets.eu/public/canceled.html`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};
