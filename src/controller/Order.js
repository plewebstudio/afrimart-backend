const Order = require("../model/Order");
const Product = require("../model/Product");
const { User } = require("../model/User");
const moment = require("moment");

// 🟢 Create a new order
// exports.createOrder = async (req, res) => {
//   try {
//     const {
//       customer_name,
//       amount_paid,
//       payment_method,
//       order_status,
//       order_items,
//     } = req.body;

//     if (
//       !customer_name ||
//       !amount_paid ||
//       !payment_method ||
//       !order_items.length
//     ) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const newOrder = new Order({
//       customer_name,
//       amount_paid,
//       payment_method,
//       order_status,
//       order_items,
//     });

//     await newOrder.save();
//     res
//       .status(201)
//       .json({ message: "Order created successfully", order: newOrder });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error creating order", error: error.message });
//   }
// };

exports.createOrder = async (req, res) => {
  try {
    const {
      customer_name,
      amount_paid,
      payment_method,
      order_status,
      order_items,
    } = req.body;

    if (
      !customer_name ||
      !amount_paid ||
      !payment_method ||
      !order_items.length
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Enhance each order item with the product image.
    const enhancedItems = await Promise.all(
      order_items.map(async (item) => {
        // Find the product by its name (or use a product ID if available)
        const product = await Product.findOne({ name: item.food_name });
        // Use the first image in the product's file array if found
        return {
          ...item,
          image:
            product && product.file && product.file.length
              ? product.file[0]
              : "",
        };
      })
    );

    const newOrder = new Order({
      customer_name,
      amount_paid,
      payment_method,
      order_status,
      order_items: enhancedItems,
    });

    await newOrder.save();
    res
      .status(201)
      .json({ message: "Order created successfully", order: newOrder });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};

// 🟡 Get all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    // Fetch latest 3 users, orders, and products
    const latestUsers = await User.find().sort({ createdAt: -1 }).limit(3);
    const latestOrders = await Order.find().sort({ createdAt: -1 }).limit(3);
    const latestProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(3);

    console.log(latestUsers);

    res.status(200).json({
      success: true,
      data: {
        users: latestUsers,
        orders: latestOrders,
        products: latestProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

exports.getOrdersPagination = async (req, res) => {
  try {
    let { page = 1, limit = 10, filter } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let query = {}; // Default query

    // If a filter is provided and it isn't "all", apply date filtering
    if (filter && filter !== "all") {
      const now = moment();
      switch (filter) {
        case "30m":
          query.created_at = { $gte: now.subtract(30, "minutes").toDate() };
          break;
        case "24h":
          query.created_at = { $gte: now.subtract(24, "hours").toDate() };
          break;
        case "7d":
          query.created_at = { $gte: now.subtract(7, "days").toDate() };
          break;
        case "month":
          query.created_at = { $gte: now.startOf("month").toDate() };
          break;
        default:
          // If filter does not match any expected value, no date filtering is applied.
          break;
      }
    }

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      orders,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching order", error: error.message });
  }
};

exports.getMostSoldItems = async (req, res) => {
  try {
    // Aggregate to find most sold items
    const mostSoldItems = await Order.aggregate([
      { $unwind: "$order_items" }, // Unwind the 'order_items' array
      {
        $group: {
          _id: "$order_items.food_name",
          totalSold: { $sum: "$order_items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } }, // Sort by highest sales
      { $limit: 5 }, // Limit to top 5 items
    ]);

    // Find max sold quantity to calculate percentage
    const maxSold = mostSoldItems.length > 0 ? mostSoldItems[0].totalSold : 1;

    // Format response with percentages
    const response = mostSoldItems.map((item) => ({
      name: item._id,
      percentage: Math.round((item.totalSold / maxSold) * 100),
    }));

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching most sold items",
      error: error.message,
    });
  }
};

exports.getMetrics = async (req, res) => {
  try {
    const now = new Date();

    // Define Last Month's Range (e.g., January 2025 if today is Feb 2025)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch Total Metrics Across All Records
    const totalOrders = await Order.countDocuments({});
    const totalSalesAgg = await Order.aggregate([
      { $group: { _id: null, totalSales: { $sum: "$amount_paid" } } },
    ]);
    const totalSales =
      totalSalesAgg.length > 0 ? totalSalesAgg[0].totalSales : 0;
    const activeUsers = await Order.distinct("customer_name", {});
    const activeUsersCount = activeUsers.length;

    // Fetch Last Month's Metrics
    const lastMonthQuery = {
      createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd },
    };

    const totalOrdersLastMonth = await Order.countDocuments(lastMonthQuery);
    const salesAggLastMonth = await Order.aggregate([
      { $match: lastMonthQuery },
      { $group: { _id: null, totalSales: { $sum: "$amount_paid" } } },
    ]);
    const totalSalesLastMonth =
      salesAggLastMonth.length > 0 ? salesAggLastMonth[0].totalSales : 0;
    const activeUsersLastMonth = await Order.distinct(
      "customer_name",
      lastMonthQuery
    );
    const activeUsersCountLastMonth = activeUsersLastMonth.length;

    // Compute Percentage Change Based on Last Month's Performance
    const percentOrdersChange = totalOrdersLastMonth
      ? ((totalOrders - totalOrdersLastMonth) / totalOrdersLastMonth) * 100
      : 0;
    const percentSalesChange = totalSalesLastMonth
      ? ((totalSales - totalSalesLastMonth) / totalSalesLastMonth) * 100
      : 0;
    const percentActiveUsersChange = activeUsersCountLastMonth
      ? ((activeUsersCount - activeUsersCountLastMonth) /
          activeUsersCountLastMonth) *
        100
      : 0;

    // Return Metrics
    res.status(200).json({
      totalSales,
      totalOrders,
      activeUsers: activeUsersCount,
      percentSalesChange,
      percentOrdersChange,
      percentActiveUsersChange,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching metrics", error: error.message });
  }
};

exports.updateByOrderId = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = req.body; // Data to update

    // If order_items is provided in the update data, enhance each item with the product image.
    if (updateData.order_items && updateData.order_items.length) {
      updateData.order_items = await Promise.all(
        updateData.order_items.map(async (item) => {
          // Find the product by its name (or use a product ID if available)
          const product = await Product.findOne({ name: item.food_name });
          return {
            ...item,
            image:
              product && product.file && product.file.length
                ? product.file[0]
                : "",
          };
        })
      );
    }

    console.log(updateData);
    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validation is applied
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res
      .status(200)
      .json({ message: "Order updated successfully", updatedOrder });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order", error: error.message });
  }
};

// 🟠 Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { order_status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order", error: error.message });
  }
};

// 🔴 Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting order", error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Define the current period (last 30 days) and the previous period (30 days before that)
    const currentPeriodStart = moment().subtract(30, "days").toDate();
    const previousPeriodStart = moment().subtract(60, "days").toDate();
    const previousPeriodEnd = moment().subtract(30, "days").toDate();

    // Helper to compute percentage change
    const calcChange = (current, previous) => {
      if (previous === 0) return 0;
      return (((current - previous) / previous) * 100).toFixed(2);
    };

    // Pending Orders
    const pendingCurrent = await Order.countDocuments({
      order_status: "pending", // Updated field name
      created_at: { $gte: currentPeriodStart },
    });
    const pendingPrevious = await Order.countDocuments({
      order_status: "pending", // Updated field name
      created_at: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
    });
    const pendingChange = calcChange(pendingCurrent, pendingPrevious);

    // Completed Orders
    const completedCurrent = await Order.countDocuments({
      order_status: "successful", // Updated field name
      created_at: { $gte: currentPeriodStart },
    });
    const completedPrevious = await Order.countDocuments({
      order_status: "successful", // Updated field name
      created_at: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
    });
    const completedChange = calcChange(completedCurrent, completedPrevious);

    // Cancelled Orders
    const cancelledCurrent = await Order.countDocuments({
      order_status: "failed", // Updated field name
      created_at: { $gte: currentPeriodStart },
    });
    const cancelledPrevious = await Order.countDocuments({
      order_status: "failed", // Updated field name
      created_at: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
    });
    const cancelledChange = calcChange(cancelledCurrent, cancelledPrevious);

    // Refund Requests
    // Make sure the refundRequested field exists in your documents.
    const refundCurrent = await Order.countDocuments({
      refundRequested: true,
      created_at: { $gte: currentPeriodStart },
    });
    const refundPrevious = await Order.countDocuments({
      refundRequested: true,
      created_at: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
    });
    const refundChange = calcChange(refundCurrent, refundPrevious);

    res.status(200).json({
      pendingOrders: {
        count: pendingCurrent,
        change: pendingChange,
      },
      completedOrders: {
        count: completedCurrent,
        change: completedChange,
      },
      cancelledOrders: {
        count: cancelledCurrent,
        change: cancelledChange,
      },
      refundRequests: {
        count: refundCurrent,
        change: refundChange,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};
