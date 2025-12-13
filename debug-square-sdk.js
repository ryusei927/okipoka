
const { SquareClient } = require("square");

const token = "EAAAlykU3iY_GVzHYroAHbRBubesIkyN-1C1q6CO9bekeBbKLBdkaJBiHjNs7HFZ";

async function test() {
  console.log("--- Test 1: Environment as URL string ---");
  try {
    const client1 = new SquareClient({
      accessToken: "Bearer " + token,
      environment: "https://connect.squareupsandbox.com",
    });
    const res1 = await client1.locations.list();
    console.log("Test 1 Success:", res1.result.locations[0].id);
  } catch (e) {
    console.log("Test 1 Failed:", e.statusCode, e.errors);
  }

  console.log("\n--- Test 2: Environment as 'sandbox' string ---");
  try {
    const client2 = new SquareClient({
      accessToken: token,
      environment: "sandbox",
    });
    const res2 = await client2.locations.list();
    console.log("Test 2 Success:", res2.result.locations[0].id);
  } catch (e) {
    console.log("Test 2 Failed:", e.message || e);
  }
}

test();
