const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// list of zero-decimal currencies (lowercase)
const ZERO_DECIMAL = new Set([
  'bif','clp','djf','gnf','jpy','kmf','krw','mga','pyg','rwf','vnd','vuv','xaf','xof','xpf'
]);

exports.payment = async (req, res) => {
  try {
    console.log("PAYMENT REQUEST BODY:", JSON.stringify(req.body, null, 2));

    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const defaultCurrency = (req.body.currency || 'usd').toLowerCase();

    const line_items = req.body.items.map((item, idx) => {
      const priceNum = Number(item.price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error(`Invalid price for item index ${idx}`);
      }

      const currency = (item.currency || defaultCurrency).toLowerCase();
      const multiplier = ZERO_DECIMAL.has(currency) ? 1 : 100;

      // Important: round to nearest integer (smallest currency unit)
      const unit_amount = Math.round(priceNum * multiplier);

      if (!Number.isInteger(unit_amount) || unit_amount < 0) {
        throw new Error(`Computed unit_amount invalid for item index ${idx}: ${unit_amount}`);
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

      return {
        price_data: {
          currency,
          product_data: {
            name: item.name || `Item ${idx}`,
            images: Array.isArray(item.images) ? item.images : [],
          },
          unit_amount,
        },
        quantity,
      };
    });

    // shipping fee handling
    const shippingCurrency = defaultCurrency;
    const shippingFeeNum = Number(req.body.shippingFee || 0);
    if (!Number.isFinite(shippingFeeNum) || shippingFeeNum < 0) {
      throw new Error("Invalid shippingFee");
    }
    const shippingMultiplier = ZERO_DECIMAL.has(shippingCurrency) ? 1 : 100;
    const shippingAmount = Math.round(shippingFeeNum * shippingMultiplier);

    // Only include shipping_address_collection if allowed_countries is non-empty array
    const shippingAddressCollection =
      Array.isArray(req.body.allowed_countries) && req.body.allowed_countries.length
        ? { allowed_countries: req.body.allowed_countries }
        : undefined;

    console.log("line_items (prepared):", JSON.stringify(line_items, null, 2));
    console.log("shippingAmount (smallest unit):", shippingAmount);

    const sessionPayload = {
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      billing_address_collection: "required",
      // only add shipping_address_collection when provided
      ...(shippingAddressCollection ? { shipping_address_collection: shippingAddressCollection } : {}),
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: req.body.shippingMethod || "Standard Shipping",
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.max(0, shippingAmount),
              currency: shippingCurrency,
            },
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: Math.max(1, req.body.deliveryEstimate?.minimum?.value ?? 1),
              },
              maximum: {
                unit: "business_day",
                value: Math.max(1, req.body.deliveryEstimate?.maximum?.value ?? 3),
              },
            },
          },
        },
      ],
      expand: ["line_items"],
      success_url: `https://www.africanmarkets.eu/public/success.html`,
      cancel_url: `https://www.africanmarkets.eu/public/canceled.html`,
    };

    const session = await stripe.checkout.sessions.create(sessionPayload);

    res.json({ id: session.id });
  } catch (err) {
    console.error("Stripe/payment error:", err);
    // if err is a Stripe error it may have .message; otherwise send generic
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
