try {
  const token = "EAAAlykU3iY_GVzHYroAHbRBubesIkyN-1C1q6CO9bekeBbKLBdkaJBiHjNs7HFZ";
  
  console.log("Testing with raw fetch...");
  
  fetch("https://connect.squareupsandbox.com/v2/locations", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  })
  .then(async res => {
    console.log("Status:", res.status);
    const data = await res.json();
    if (res.ok) {
      console.log("Success! Locations:", data.locations?.map(l => l.id));
    } else {
      console.log("Error Body:", JSON.stringify(data, null, 2));
    }
  })
  .catch(err => console.error("Fetch error:", err));

} catch (e) {
  console.error("Error:", e);
}
