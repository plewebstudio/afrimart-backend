const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Product = require("./model/Product"); // adjust path as necessary
const BestSeller = require("./model/BestSeller"); // adjust path as necessary

/**
 * Webhook handler for Stripe events.
 * Listens for "stripe_checkout" events to update product stock and bestsellers.
 */
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Listen for the custom event type "stripe_checkout"
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log(session);
    // Assume session.line_items is an array of purchased items
    // where each item has a productId and quantity field.
    const lineItems = session.line_items;

    if (Array.isArray(lineItems)) {
      for (const item of lineItems) {
        console.log(item);
        const { productId, quantity } = item;

        try {
          // Deduct the purchased quantity from the product's stock
          const product = await Product.findById(productId);
          if (product) {
            console.log(product);
            product.StockQuantity = product.StockQuantity - quantity;
            console.log(product);
            await product.save();

            // Update the bestsellers record for this product
            let bestSeller = await BestSeller.findOne({ product: productId });
            if (bestSeller) {
              bestSeller.soldQuantity += quantity;
              await bestSeller.save();
            } else {
              await BestSeller.create({
                product: productId,
                soldQuantity: quantity,
              });
            }
          } else {
            console.warn(`Product with ID ${productId} not found.`);
          }
        } catch (err) {
          console.error(
            `Error processing item with product ID ${productId}:`,
            err.message
          );
        }
      }
    } else {
      console.warn("No line_items found in the session.");
    }
  }

  // Respond to Stripe to acknowledge receipt of the event.
  res.json({ received: true });
};
