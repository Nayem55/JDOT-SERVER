const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { default: axios } = require("axios");
const crypto = require("crypto");

require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

const allowedOrigins = [
  "https://j.fragrancesbd.com",
  "https://www.j.fragrancesbd.com",
  "https://shop.fragrancesbd.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      // allow any localhost port
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }

      // allow production domains
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // block everything else
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
// ✅ handle preflight properly
app.options("*", cors());

app.use(express.json({ limit: "10mb" }));

require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

// app.use(require('prerender-node').set('prerenderToken', 'acSrdk6q1skW6zoArcQT'));

// database user and password
// flormarwebuser
// https://flormar-web-server-nayem55.vercel.app

const uri =
  "mongodb+srv://jdot:jdot@cluster0.jzzej6f.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const productCollection = client.db("JDOT").collection("products");
    const orderCollection = client.db("JDOT").collection("orders");
    const userCollection = client.db("JDOT").collection("users");
    const couponCollection = client.db("JDOT").collection("coupons");
    const blogCollection = client.db("JDOT").collection("blogs");
    const faqCollection = client.db("JDOT").collection("faqs");
    const reviewCollection = client.db("JDOT").collection("reviews");
    const categoryCollection = client.db("JDOT").collection("categories");
    const distributors = client.db("JDOT").collection("distributors");
    const popup = client.db("JDOT").collection("popup");

    const projection = {
      _id: 1,
      id: 1,
      name: 1,
      slug: 1,
      price: 1,
      description: 1,
      images: 1,
      on_sale: 1,
      stock_quantity: 1,
      regular_price: 1,
      sale_price: 1,
      average_rating: 1,
      rating_count: 1,
      attributes: 1,
      sku: 1,
      tags: 1,
      short_description: 1,
      categories: 1,
      reviews: 1,
      variations: 1,
      meta_description: 1,
      stock_status: 1,
      brand: 1,
      date_created: 1,
    };
    const projection4 = {
      _id: 0,
      name: 1,
      slug: 1,
      description: 1,
      images: 1,
      stock_status: 1,
      regular_price: 1,
      sku: 1,
      short_description: 1,
      categories: 1,
      meta_description: 1,
      attributes: 1,
    };
    const projection5 = {
      _id: 0,
      id: 1,
    };
    // Function to convert a product name to a slug
    // function product_name_to_slug(product_name) {
    //   let slug = product_name.replace(/[^a-zA-Z0-9-]+/g, "-");
    //   slug = slug.replace(/-+/g, "-");
    //   slug = slug.replace(/^-+|-+$/g, "");
    //   return slug;
    // }

    // insert products
    // app.get("/insert", async (req, res) => {
    //   productCollection.insertMany(data)
    //     .then((result) => {
    //       console.log(
    //         `Successfully inserted ${result.length} documents into MongoDB`
    //       );
    //     })
    //     .catch((error) => {
    //       console.error("Error inserting data into MongoDB:", error);
    //     });
    // });
    // Add field to all products
    app.patch("/addFieldToAllProducts", async (req, res) => {
      const brandName = "Earth beauty & you"; // You can replace this with req.body.brand if dynamic

      if (!brandName) {
        return res.status(400).send({ message: "Brand name is required." });
      }

      try {
        const result = await productCollection.updateMany(
          {}, // Filter: only products with status 'publish'
          { $set: { brand: brandName } }, // Update: set the brand field to the given brand name
        );

        res.send({
          message: `${result.modifiedCount} products updated with brand: ${brandName}`,
        });
        console.log(
          `${result.modifiedCount} products updated with brand: ${brandName}`,
        );
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update products." });
      }
    });

    // get products
    app.get("/products", async (req, res) => {
      const query = { status: "publish" };
      const cursor = productCollection
        .find(query)
        .sort({ date_created: -1 })
        .project(projection);
      const result = await cursor.toArray();
      res.send(result);
      console.log(result.length);
    });
    app.get("/getAllProducts", async (req, res) => {
      const query = { status: "publish" };
      const cursor = productCollection
        .find(query)
        .sort({ date_created: -1 })
        .project(projection4);
      const result = await cursor.toArray();
      res.send(result);
      console.log(result.length);
    });

    // app.get("/update-product-slugs", async (req, res) => {
    //   try {
    //     const query = { status: "publish", stock_status: "instock" };
    //     const cursor = productCollection
    //       .find(query)
    //       .sort({ date_created: -1 })
    //       .project(projection);
    //     const products = await cursor.toArray();

    //     for (const product of products) {
    //       const newSlug = product_name_to_slug(product.name);
    //       await productCollection.updateOne(
    //         { _id: product._id },
    //         { $set: { slug: newSlug } }
    //       );
    //     }

    //     return res.json({ message: "Product slugs updated successfully" });
    //   } catch (error) {
    //     return res
    //       .status(500)
    //       .json({ error: "An error occurred while updating product slugs" });
    //   }
    // });
    app.get("/updateSaleStatus", async (req, res) => {
      try {
        const query = {
          status: "publish",
          stock_status: "instock",
        };
        const products = await productCollection
          .find(query)
          .project(projection)
          .toArray();
        console.log(products.length);

        for (const product of products) {
          await productCollection.updateOne(
            { _id: product._id },
            {
              $set: {
                on_sale: true,
                sale_price: Math.floor(product.regular_price * 0.8),
              },
            },
          );
        }

        return res.json({
          message: "Product sale status updated successfully",
        });
      } catch (error) {
        return res.status(500).json({
          error: "An error occurred while updating product sale status",
        });
      }
    });

    app.get("/shop", async (req, res) => {
      const page = req.query.page;
      const query = {
        status: "publish",
      };
      const cursor = productCollection
        .find(query)
        // .sort({ date_created: -1 })
        .skip(page * 50)
        .limit(50)
        .project(projection);
      const result = await cursor.toArray();
      res.send(result);
    });

    //get shop products count
    app.get("/shopProductCount", async (req, res) => {
      const query = {
        status: "publish",
      };
      const count = await productCollection.countDocuments(query);
      res.send({ count });
    });

    // get admin dashboard products
    app.get("/Allproducts", async (req, res) => {
      const page = parseInt(req.query.page);
      const query = {};
      let products;
      if (page) {
        products = await productCollection
          .find(query)
          .sort({ date_created: -1 })
          .skip(page * 50)
          .limit(50)
          .toArray();
      } else {
        products = await productCollection
          .find(query)
          .sort({ date_created: -1 })
          .limit(50)
          .toArray();
      }
      res.send(products);
      console.log(products.length);
    });
    //ssl-wireless single sms
    app.post("/send-sms", async (req, res) => {
      try {
        const response = await axios.post(
          "https://smsplus.sslwireless.com/api/v3/send-sms",
          req.body, // Forward the payload received from the frontend
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        res.status(response.status).json(response.data);
      } catch (error) {
        console.error(error.message);
        res.status(500).send("Failed to send SMS");
      }
    });

    // get all products
    app.get("/backup", async (req, res) => {
      const page = parseInt(req.query.page);
      const query = {};
      let products;
      if (page) {
        products = await productCollection
          .find(query)
          .sort({ date_created: -1 })
          .skip(page * 100)
          .limit(100)
          .toArray();
      } else {
        products = await productCollection
          .find(query)
          .sort({ date_created: -1 })
          .limit(100)
          .toArray();
      }
      res.send(products);
      console.log(products.length);
    });

    // get single product
    app.get("/getSingleProduct/:slug", async (req, res) => {
      const slug = req.params.slug.toString();
      console.log(slug);
      const product = await productCollection.findOne({
        slug: slug,
      });
      res.send(product);
    });

    // get single backend product
    app.get("/backendProduct/:id", async (req, res) => {
      const id = req.params.id;
      const product = await productCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(product);
    });

    //get amount of data
    app.get("/productCount", async (req, res) => {
      const count = await productCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.get("/orderCount", async (req, res) => {
      const count = await orderCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.get("/last-order-id", async (req, res) => {
      try {
        // Use find() to get all orders, then sort to get the most recent one
        const lastOrder = await orderCollection
          .find() // Use find() to get all orders
          .sort({ order_date: -1 })
          .limit(1)
          .project(projection5)
          .toArray();

        if (lastOrder.length === 0) {
          return res.send([
            {
              id: 1000,
            },
          ]);
        }

        // Send the last order's ID
        res.send(lastOrder); // Access the first (and only) element in the array
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    app.get("/reviewCount", async (req, res) => {
      const count = await reviewCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // get new arrivals
    app.get("/newArrivals", async (req, res) => {
      const query = { status: "publish", stock_status: "instock" };
      const cursor = productCollection
        .find(query)
        .sort({ date_created: -1 })
        .limit(50)
        .project(projection);
      const result = await cursor.toArray();
      res.send(result);
      console.log(result.length);
    });

    app.get("/categories", async (req, res) => {
      const query = {};
      const cursor = categoryCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //get products by tags
    app.get("/getProductsByTags", async (req, res) => {
      const page = req.query.page;
      const name = req.query.name;
      const query = {
        status: "publish",
        "tags.name": {
          $regex: new RegExp(name, "i"), // "i" for case-insensitive
        },
      };

      const cursor = productCollection
        .find(query)
        .limit(50)
        .project(projection);
      const result = await cursor.toArray();
      res.send(result);
      console.log(result.length);
    });
    //filter products by tags
    app.get("/filterByTags", async (req, res) => {
      const page = req.query.page;
      const name = req.query.name;
      const query = {
        "tags.name": {
          $regex: new RegExp(name, "i"), // "i" for case-insensitive
        },
      };

      const cursor = productCollection.find(query).sort({ date_created: -1 });
      const result = await cursor.toArray();
      res.send(result);
      console.log(result.length);
    });
    //get products count by categories
    app.get("/categoryProductCount", async (req, res) => {
      const name = req.query.name;
      console.log(name);
      const query = {
        status: "publish",
        "categories.name": {
          $regex: new RegExp(name, "i"), // "i" for case-insensitive
        },
      };
      const count = await productCollection.countDocuments(query);
      res.send({ count });
    });

    //get products by categories
    app.get("/getProductsByCategories", async (req, res) => {
      const page = req.query.page;
      const name = req.query.name;
      const query = {
        status: "publish",
        "categories.name": {
          $regex: new RegExp(`\\b${name}\\b`, "i"), // "i" for case-insensitive
        },
      };
      const cursor = productCollection
        .find(query)
        .sort({ date_created: -1 })
        .skip(page * 50)
        .limit(50)
        .project(projection);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/productsByCategories", async (req, res) => {
      const page = req.query.page;
      const name = req.query.name;
      const query = {
        status: "publish",
        "categories.name": {
          $regex: new RegExp(`\\b${name}\\b`, "i"), // "i" for case-insensitive
        },
      };
      const cursor = productCollection
        .find(query)
        .sort({ date_created: -1 })
        .skip(page * 12)
        .limit(12)
        .project(projection);
      const result = await cursor.toArray();
      res.send(result);
    });

    //filter products by categories
    app.get("/filterByCategories", async (req, res) => {
      const page = req.query.page;
      const name = req.query.name;
      const query = {
        "categories.name": {
          $regex: new RegExp(name, "i"), // "i" for case-insensitive
        },
      };
      const cursor = productCollection.find(query).sort({ date_created: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    // post product
    app.post("/addProduct", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    // edit product
    app.put("/editProduct/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: data,
      };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options,
      );
      res.send(result);
    });

    // delete product
    app.delete("/deleteProduct/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(filter);
      res.send(result);
    });

    // search backend product
    app.get("/search/:searchedText", async (req, res) => {
      const searchedText = req.params.searchedText;
      console.log(searchedText);
      const result = await productCollection
        .find({ name: { $regex: searchedText, $options: "i" } })
        .toArray();
      res.send(result);
      console.log(result.length);
    });
    // search frontend product
    app.get("/searchProduct/:searchText", async (req, res) => {
      const searchText = req.params.searchText;
      console.log(searchText);
      const query = {
        status: "publish",
        name: {
          $regex: searchText,
          $options: "i", // "i" for case-insensitive
        },
      };
      const result = await productCollection
        .find(query)
        .sort({ date_created: -1 })
        .project(projection)
        .toArray();
      res.send(result);
      console.log(result.length);
    });

    // search order by name
    app.get("/searchOrder/:searchedText", async (req, res) => {
      const searchedText = req.params.searchedText;
      const query = [
        {
          $match: {
            $expr: {
              $regexMatch: {
                input: {
                  $concat: ["$billing.first_name", " ", "$billing.last_name"],
                },
                regex: searchedText,
                options: "i",
              },
            },
          },
        },
      ];
      const result = await orderCollection
        .aggregate(query)
        .sort({ order_date: -1 })
        .toArray();
      res.send(result);
      console.log(result.length);
    });
    // search order by id
    app.get("/searchOrderById/:searchedText", async (req, res) => {
      const searchedText = req.params.searchedText;
      console.log(searchedText);
      const query = {
        id: parseInt(searchedText),
      };
      const result = await orderCollection
        .find(query)
        .sort({ order_date: -1 })
        .toArray();
      res.send(result);
      console.log(result.length);
    });
    // search order by phone
    app.get("/searchOrderByPhone/:searchedText", async (req, res) => {
      const searchedText = req.params.searchedText;
      const query = {
        "billing.phone": { $regex: searchedText, $options: "i" },
      };
      const result = await orderCollection
        .find(query)
        .sort({ order_date: -1 })
        .toArray();
      res.send(result);
      console.log(result.length);
    });
    // search user
    app.get("/searchUser/:searchedText", async (req, res) => {
      const searchedText = req.params.searchedText;
      const query = {
        name: { $regex: searchedText, $options: "i" },
      };
      const result = await userCollection.find(query).toArray();
      res.send(result);
      console.log(result.length);
    });
    // get order confirmation data
    app.get("/orderConfirmation/:confirmationTime", async (req, res) => {
      const confirmationTime = req.params.confirmationTime;
      const query = { order_time: parseInt(confirmationTime) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    });

    // ---- Helpers................................................
    function sha256(v) {
      return crypto.createHash("sha256").update(v).digest("hex");
    }
    function normEmail(email) {
      return String(email || "")
        .trim()
        .toLowerCase();
    }
    function normPhoneBD(phone) {
      // expects 01XXXXXXXXX -> +8801XXXXXXXXX
      const p = String(phone || "").trim();
      if (!p) return "";
      if (p.startsWith("+")) return p;
      if (p.length === 11 && p.startsWith("01")) return `+88${p}`;
      return p;
    }
    function hashIfPresent(value, normalizer = (x) => x) {
      const v = normalizer(value);
      if (!v) return undefined;
      return sha256(v);
    }
    function getClientIp(req) {
      const xf = req.headers["x-forwarded-for"];
      if (xf) return String(xf).split(",")[0].trim();
      return req.ip;
    }

    // ---- Send Purchase to Meta CAPI
    async function sendPurchaseCapi({ req, order, eventId, eventSourceUrl }) {
      const pixelId = process.env.META_PIXEL_ID;
      const token = process.env.META_CAPI_TOKEN;

      if (!pixelId || !token)
        return { skipped: true, reason: "Missing pixel/token" };

      // Use a current Graph version. If you prefer, change v23.0 to a newer one later.
      const url = `https://graph.facebook.com/v23.0/${pixelId}/events`;

      const event_time = Math.floor(Date.now() / 1000);

      // cookies set by Meta Pixel in browser (best if you serve your API on same domain/subdomain)
      const fbp = req.cookies?._fbp;
      const fbc = req.cookies?._fbc;

      const billing = order?.billing || {};
      const items = Array.isArray(order?.items) ? order.items : [];

      // Build contents
      const contents = items.map((p) => ({
        id: String(p.product_id),
        quantity: Number(p.quantity || 1),
        // optional: item_price improves reporting
        item_price:
          p.total && p.quantity
            ? Number(p.total) / Number(p.quantity)
            : undefined,
      }));

      const payload = {
        data: [
          {
            event_name: "Purchase",
            event_time,
            event_id: String(eventId),
            action_source: "website",
            event_source_url: eventSourceUrl,

            user_data: {
              client_ip_address: getClientIp(req),
              client_user_agent: req.headers["user-agent"],

              em: hashIfPresent(billing.email, normEmail),
              ph: hashIfPresent(billing.phone, normPhoneBD),

              fn: hashIfPresent(billing.first_name, (x) =>
                String(x || "")
                  .trim()
                  .toLowerCase(),
              ),
              ln: hashIfPresent(billing.last_name, (x) =>
                String(x || "")
                  .trim()
                  .toLowerCase(),
              ),
              ct: hashIfPresent(billing.city, (x) =>
                String(x || "")
                  .trim()
                  .toLowerCase(),
              ),
              st: hashIfPresent(billing.state, (x) =>
                String(x || "")
                  .trim()
                  .toLowerCase(),
              ),
              country: hashIfPresent(billing.country, (x) =>
                String(x || "")
                  .trim()
                  .toLowerCase(),
              ),

              fbp,
              fbc,
            },

            custom_data: {
              currency: "BDT",
              value: Number(order.total || 0),
              content_type: "product",
              contents,
            },
          },
        ],
      };

      if (process.env.META_TEST_EVENT_CODE) {
        payload.test_event_code = process.env.META_TEST_EVENT_CODE;
      }

      const resp = await axios.post(url, payload, {
        params: { access_token: token },
        timeout: 15000,
      });

      return resp.data;
    }

    // post order list
    app.post("/order", async (req, res) => {
      try {
        const { order, eventId, eventSourceUrl } = req.body;

        if (!order) return res.status(400).send({ error: "Missing order" });
        if (!eventId) return res.status(400).send({ error: "Missing eventId" });

        // Save order
        const insertRes = await orderCollection.insertOne({
          ...order,
          _capi_event_id: String(eventId),
          _event_source_url: eventSourceUrl || "",
          createdAt: new Date(),
        });

        // Send CAPI (do not break order if Meta fails)
        let capiResult = null;
        try {
          capiResult = await sendPurchaseCapi({
            req,
            order,
            eventId,
            eventSourceUrl: eventSourceUrl || req.headers.referer || "",
          });
          console.log(capiResult);
        } catch (e) {
          console.error("❌ CAPI error:", e?.response?.data || e.message);
        }

        res.send({
          ok: true,
          insertedId: insertRes.insertedId,
          capi: capiResult,
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Order failed" });
      }
    });
    // get admin dashboard orders
    app.get("/orders", async (req, res) => {
      const page = parseInt(req.query.page);
      const query = {};
      let orders;
      if (page) {
        orders = await orderCollection
          .find(query)
          .sort({ order_date: -1 })
          .skip(page * 50)
          .limit(50)
          .toArray();
      } else {
        orders = await orderCollection
          .find(query)
          .sort({ order_date: -1 })
          .limit(50)
          .toArray();
      }
      res.send(orders);
      console.log(orders.length);
    });
    app.get("/orders/total", async (req, res) => {
      const platform = req.query.platform; // Add platform parameter
      const query = {};

      if (platform) {
        query.platform = platform;
      }

      const orders = await orderCollection.find(query).toArray();

      const totalValue = orders.reduce((total, order) => {
        return total + parseInt(order.total);
      }, 0);

      res.send({ totalValue });
    });
    // get admin dashboard sorted order - Add platform filter
    app.get("/sortOrders", async (req, res) => {
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      const platform = req.query.platform; // Add platform parameter

      const query = {
        order_date: {
          $gte: startDate,
          $lte: endDate,
        },
        order_status: "New order",
      };

      if (platform) {
        query.platform = platform;
      }

      const orders = await orderCollection
        .find(query)
        .sort({ order_date: -1 })
        .toArray();

      res.send(orders);
    });
    // get user order list
    app.get("/userOrder/:ph", async (req, res) => {
      const ph = req.params.ph;
      console.log(ph);
      const query = {
        $or: [{ "billing.phone": ph }, { "billing.phone": ph.substring(3) }],
      };
      console.log(query);
      const cursor = orderCollection.find(query).sort({ order_date: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/user1Order/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { "billing.email": email };
      const cursor = orderCollection.find(query).sort({ order_date: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    // get user order count
    app.get("/userOrderCount/:ph", async (req, res) => {
      const ph = req.params.ph;
      const query = { "billing.phone": ph };
      const count = await orderCollection.estimatedDocumentCount(query);
      res.send({ count });
    });

    // get single order
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const product = await orderCollection.findOne({
        id: parseInt(id),
      });
      res.send(product);
    });
    // get single order
    app.get("/uniqueOrder/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const product = await orderCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(product);
    });
    // edit order
    app.put("/editOrder/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: data,
      };
      const result = await orderCollection.updateOne(
        filter,
        updatedDoc,
        options,
      );
      res.send(result);
    });
    // edit user
    app.put("/editUser/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: data,
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options,
      );
      res.send(result);
    });
    // delete order
    app.delete("/deleteOrder/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(filter);
      res.send(result);
    });
    // delete user
    app.delete("/deleteUser/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(filter);
      res.send(result);
    });
    // post user
    app.post("/postUser", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // post user with Google login
    app.post("/postGoogleUser/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const user = req.body;
      console.log(user);
      const query = { email: email };
      const exist = await userCollection.findOne(query);
      console.log(exist);
      if (!exist) {
        const result = await userCollection.insertOne(user);
        res.send(result);
      } else {
        res.send({});
      }
    });
    // get all user
    app.get("/getAllUser", async (req, res) => {
      const page = parseInt(req.query.page);
      const query = {};
      let users;
      if (page) {
        users = await userCollection
          .find(query)
          .skip(page * 50)
          .limit(50)
          .toArray();
      } else {
        users = await userCollection.find(query).limit(50).toArray();
      }
      res.send(users);
      console.log(users.length);
    });

    // Get single user
    app.get("/getUser/:number", async (req, res) => {
      const number = req.params.number;
      const query = { phone: number };
      const result = await userCollection.findOne(query);
      if (result) {
        res.send(result);
      } else {
        res.send({});
      }
    });
    app.get("/getUser/:email", async (req, res) => {
      const email = req.params.number;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      if (result) {
        res.send(result);
      } else {
        res.send({});
      }
    });
    //admin varification with phone
    app.get("/users/admin/:ph", async (req, res) => {
      const ph = req.params.ph;
      const query = { phone: ph };
      const user = await userCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });
    //admin varification with email
    app.get("/users/admin1/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const user = await userCollection.findOne(query);
      console.log(user);
      res.send({ isAdmin: user?.role === "admin" });
    });
    // get coupons
    app.get("/getCoupons", async (req, res) => {
      const query = { status: "publish" };
      const coupons = await couponCollection.find(query).toArray();
      res.send(coupons);
      console.log(coupons.length);
    });
    // get coupons for admin panel
    app.get("/getAllCoupons", async (req, res) => {
      const query = {};
      const coupons = await couponCollection
        .find(query)
        .sort({ date_expires: -1 })
        .toArray();
      res.send(coupons);
      console.log(coupons.length);
    });
    // get single coupon for admin panel
    app.get("/getCoupon/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const coupon = await couponCollection.findOne(query);
      res.send(coupon);
    });
    // post coupon
    app.post("/addCoupon", async (req, res) => {
      const coupon = req.body;
      const result = await couponCollection.insertOne(coupon);
      res.send(result);
    });

    // edit coupon
    app.put("/editCoupon/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: data,
      };
      const result = await couponCollection.updateOne(
        filter,
        updatedDoc,
        options,
      );
      res.send(result);
    });

    // delete coupon
    app.delete("/deleteCoupon/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const result = await couponCollection.deleteOne(filter);
      res.send(result);
    });

    // get faqs
    app.get("/getFaqs", async (req, res) => {
      const faqs = await faqCollection.find({}).toArray();
      res.send(faqs);
      console.log(faqs.length);
    });

    // get blogs
    app.get("/getBlogs", async (req, res) => {
      const query = { status: "publish" };
      const blogs = await blogCollection.find(query).toArray();
      res.send(blogs);
      console.log(blogs.length);
    });
    // get single coupon for admin panel
    app.get("/getBlog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const coupon = await blogCollection.findOne(query);
      res.send(coupon);
    });
    // post blog
    app.post("/addBlog", async (req, res) => {
      const blog = req.body;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });

    // edit blog
    app.put("/editBlog/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: data,
      };
      const result = await blogCollection.updateOne(
        filter,
        updatedDoc,
        options,
      );
      res.send(result);
    });

    // delete blog
    app.delete("/deleteBlog/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const result = await blogCollection.deleteOne(filter);
      res.send(result);
    });
    // get admin blogs
    app.get("/getAllBlogs", async (req, res) => {
      const query = {};
      const blogs = await blogCollection.find(query).toArray();
      res.send(blogs);
      console.log(blogs.length);
    });
    // get reviews
    app.get("/reviews", async (req, res) => {
      const productId = req.query.productId; // Get the product ID from the query parameters
      const query = { status: "approved", product_id: productId }; // Add product ID to the query

      try {
        const reviews = await reviewCollection.find(query).toArray();
        res.send(reviews);
        console.log(reviews.length);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ message: "An error occurred while fetching reviews." });
      }
    });
    // get all reviews
    app.get("/allReviews", async (req, res) => {
      const page = parseInt(req.query.page);
      const query = {};
      let reviews;
      if (page) {
        reviews = await reviewCollection
          .find(query)
          .sort({ date_created: -1 })
          .skip(page * 50)
          .limit(50)
          .toArray();
      } else {
        reviews = await reviewCollection
          .find(query)
          .sort({ date_created: -1 })
          .limit(50)
          .toArray();
      }
      res.send(reviews);
      console.log(reviews.length);
    });
    // post reviews
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    // update reviews
    app.put("/review/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: data,
      };
      const result = await reviewCollection.updateOne(
        filter,
        updatedDoc,
        options,
      );
      res.send(result);
    });

    // delete review
    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(filter);
      res.send(result);
    });

    // Express route to delete a field from all documents
    // app.post("/delete-field-from-all", async (req, res) => {
    //   const fieldToDelete = "yoast_head_json"; // Replace with the field you want to delete

    //   try {
    //     const updateResult = await productCollection.updateMany(
    //       {},
    //       { $unset: { [fieldToDelete]: 1 } }
    //     );

    //     res.json({
    //       message: `Field "${fieldToDelete}" deleted from ${updateResult.nModified} documents`,
    //     });
    //   } catch (error) {
    //     console.error("Error deleting field:", error);
    //     res.status(500).json({ error: "Internal server error" });
    //   }
    // });

    // Submit distributor form
    app.post("/distributors", async (req, res) => {
      try {
        await distributors.insertOne({ ...req.body, createdAt: new Date() });
        res.status(200).json({ message: "Submitted successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
      }
    });

    // Get all distributor submissions (Admin Panel)
    app.get("/distributors", async (req, res) => {
      try {
        const data = await distributors
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.status(200).json(data);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching data" });
      }
    });

    // Delete distributor by ID
    app.delete("/distributors/:id", async (req, res) => {
      try {
        const result = await distributors.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        if (result.deletedCount === 1) {
          res.status(200).json({ message: "Deleted successfully" });
        } else {
          res.status(404).json({ message: "Distributor not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting distributor" });
      }
    });

    app.get("/api/popup", async (req, res) => {
      try {
        const doc = await popup.findOne({ _id: "EBAY_POPUP" });
        if (!doc) {
          return res.json({
            imageUrl: "",
            message: "",
            enabled: false,
            updatedAt: null,
          });
        }
        const {
          imageUrl = "",
          message = "",
          enabled = false,
          updatedAt = null,
        } = doc;
        res.json({ imageUrl, message, enabled, updatedAt });
      } catch (err) {
        console.error("GET /api/popup error:", err);
        res.status(500).json({ error: "Failed to load popup settings" });
      }
    });

    app.put("/api/popup", async (req, res) => {
      try {
        const { imageUrl = "", message = "", enabled = false } = req.body || {};
        if (typeof imageUrl !== "string" || typeof message !== "string") {
          return res
            .status(400)
            .json({ error: "imageUrl and message must be strings" });
        }

        const payload = {
          _id: "EBAY_POPUP",
          imageUrl: imageUrl.trim(),
          message: message.trim(),
          enabled: Boolean(enabled),
          updatedAt: new Date(),
        };

        await popup.updateOne(
          { _id: "EBAY_POPUP" },
          { $set: payload },
          { upsert: true },
        );
        res.json({ ok: true });
      } catch (err) {
        console.error("PUT /api/popup error:", err);
        res.status(500).json({ error: "Failed to save popup settings" });
      }
    });

    app.post("/api/popup", async (req, res) => {
      try {
        const { imageUrl = "", message = "", enabled = true } = req.body || {};

        if (!imageUrl || !message) {
          return res
            .status(400)
            .json({ error: "imageUrl and message are required" });
        }
        if (typeof imageUrl !== "string" || typeof message !== "string") {
          return res
            .status(400)
            .json({ error: "imageUrl and message must be strings" });
        }

        const payload = {
          _id: "EBAY_POPUP",
          imageUrl: imageUrl.trim(),
          message: message.trim(),
          enabled: Boolean(enabled),
          updatedAt: new Date(),
        };

        const result = await popup.updateOne(
          { _id: "EBAY_POPUP" },
          { $setOnInsert: payload },
          { upsert: true },
        );

        if (result.upsertedCount === 1) {
          return res
            .status(201)
            .json({ ok: true, created: true, id: "EBAY_POPUP" });
        }

        return res.status(409).json({
          ok: false,
          created: false,
          error: "Popup already exists. Use PUT /api/popup to update.",
        });
      } catch (err) {
        console.error("POST /api/popup error:", err);
        res.status(500).json({ error: "Failed to create popup settings" });
      }
    });

    const variations = [
      {
        color: "Medium Peach Beige",
        code: "#cd9773",
        product_id: "651d17cd1bd9669a312a6ad2",
      },
      {
        color: "Medium Cream",
        code: "#cf9265",
        product_id: "651d17cd1bd9669a312a6ad0",
      },
      {
        color: "Medium Rose",
        code: "#d9b9a6",
        product_id: "651d17cd1bd9669a312a6ad1",
      },
      {
        color: "Medium Cream Rose",
        code: "#d39c7d",
        product_id: "651d17cd1bd9669a312a6ace",
      },
      {
        color: "Medium Soft Peach",
        code: "#d7a383",
        product_id: "651d17cd1bd9669a312a6acf",
      },
      // {
      //   color:"Natural Coral Beige",
      //   code:"#f0c4a4",
      //   product_id:"64f57a6caba2a3d7dc5a59d4"
      // },
      {
        color: "Light Porcelain Beige",
        code: "#f0d4bc",
        product_id: "651d17cd1bd9669a312a6acb",
      },
      // {
      //   color:"Light Porcelain Opal",
      //   code:"#f8dcd4",
      //   product_id:"64f57a6caba2a3d7dc5a59d3"
      // },
      {
        color: "Light Cream",
        code: "#f8ccb4",
        product_id: "651d17cd1bd9669a312a6aeb",
      },
      {
        color: "Medium Natural Beige",
        code: "#f0c4a4",
        product_id: "651d17cd1bd9669a312a6aca",
      },
      // {
      //   color:"Almond",
      //   code:"#f7ad64",
      //   product_id:"64f57a6caba2a3d7dc5a59d0"
      // },
      // {
      //   color:"Honey",
      //   code:"#d2854d",
      //   product_id:"64f57a6caba2a3d7dc5a59cf"
      // },
      // {
      //   color:"Caramel",
      //   code:"#d2824e",
      //   product_id:"64f57a6caba2a3d7dc5a59ce"
      // },
      // {
      //   color:"Cocoa",
      //   code:"#a36a4d",
      //   product_id:"64f57a6caba2a3d7dc5a59cd"
      // },
    ];

    app.get("/updateVariation", async (req, res) => {
      const query = {
        name: {
          $regex: new RegExp("Flormar Compact Powder", "i"), // "i" for case-insensitive
        },
      };
      const result = await productCollection.updateMany(query, {
        $set: { variations: variations },
      });
      res.send(result);
    });
    app.get("/node-version", (req, res) => {
      res.send(`Running on Node.js ${process.version}`);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Server is runing");
});

app.listen(port, () => {
  console.log("Listening at port", port);
});
