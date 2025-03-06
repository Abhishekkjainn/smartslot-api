require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
const axios = require('axios');
const { db } = require('./firebase');
const fs = require('fs');

app.use(cors());
app.use(express.json());

const projectId = process.env.GOOGLE_PROJECT_ID;
const privateKeyId = process.env.GOOGLE_PRIVATE_KEY_ID;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const clientId = process.env.GOOGLE_CLIENT_ID;
const authUri = process.env.GOOGLE_AUTH_URI;
const tokenUri = process.env.GOOGLE_TOKEN_URI;
const authProviderCertUrl = process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL;
const clientCertUrl = process.env.GOOGLE_CLIENT_X509_CERT_URL;
const universeDomain = process.env.GOOGLE_UNIVERSE_DOMAIN;

app.get('/', (req, res) => {
  res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Documentation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            padding: 20px;
            background-color: #f4f4f4;
          }
          h1, h2, h3 {
            color: #333;
          }
          code {
            background-color: #eee;
            padding: 2px 5px;
            border-radius: 3px;
          }
          pre {
            background-color: #eee;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
          }
          .endpoint {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .endpoint h3 {
            margin-top: 0;
          }
          .response, .error {
            margin-top: 10px;
          }
          .response pre, .error pre {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <h1>API Documentation</h1>
        <p>This is the documentation for the SmartSpot API. Below are the available endpoints, their expected inputs, and responses.</p>
  
        <div class="endpoint">
          <h2>1. Register a Venue</h2>
          <p><strong>Endpoint:</strong> <code>POST /register-venue/:name/:totalspots/:smartspots/:venueid</code></p>
          <p><strong>Description:</strong> Registers a new venue with the provided details.</p>
          <p><strong>Parameters:</strong></p>
          <ul>
            <li><code>name</code>: Name of the venue (string).</li>
            <li><code>totalspots</code>: Total number of parking spots (positive integer).</li>
            <li><code>smartspots</code>: Number of smart parking spots (non-negative integer, ≤ totalspots).</li>
            <li><code>venueid</code>: Unique ID for the venue (string).</li>
          </ul>
          <p><strong>Response:</strong></p>
          <div class="response">
            <p><strong>Status Code:</strong> <code>201 Created</code></p>
            <pre>
  {
    "message": "Venue registered successfully.",
    "venue": {
      "name": "Venue Name",
      "venueid": "venue123",
      "totalspots": 50,
      "smartspots": 20
    },
    "slots": [
      {
        "slotid": 1,
        "status": false,
        "carnumber": null
      },
      ...
    ]
  }
            </pre>
          </div>
          <p><strong>Error Responses:</strong></p>
          <div class="error">
            <p><strong>Status Code:</strong> <code>400 Bad Request</code></p>
            <pre>
  {
    "error": "Missing required parameters."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>400 Bad Request</code></p>
            <pre>
  {
    "error": "Invalid totalspots value. It must be a positive integer."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>400 Bad Request</code></p>
            <pre>
  {
    "error": "Invalid smartspots value. It must be a non-negative integer and less than or equal to totalspots."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>409 Conflict</code></p>
            <pre>
  {
    "error": "Venue with this ID already exists. Please use a different ID."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>500 Internal Server Error</code></p>
            <pre>
  {
    "error": "An unexpected error occurred while registering the venue.",
    "details": "Error message details"
  }
            </pre>
          </div>
        </div>
  
        <div class="endpoint">
          <h2>2. Fetch Slots for a Venue</h2>
          <p><strong>Endpoint:</strong> <code>GET /fetchslots/venueid=:venueid</code></p>
          <p><strong>Description:</strong> Fetches the parking slots for a specific venue.</p>
          <p><strong>Parameters:</strong></p>
          <ul>
            <li><code>venueid</code>: Unique ID of the venue (string).</li>
          </ul>
          <p><strong>Response:</strong></p>
          <div class="response">
            <p><strong>Status Code:</strong> <code>200 OK</code></p>
            <pre>
  {
    "message": "Venue slots fetched successfully.",
    "venue": {
      "name": "Venue Name",
      "venueid": "venue123",
      "totalspots": 50,
      "smartspots": 20,
      "slots": [
        {
          "slotid": 1,
          "status": false,
          "carnumber": null
        },
        ...
      ]
    }
  }
            </pre>
          </div>
          <p><strong>Error Responses:</strong></p>
          <div class="error">
            <p><strong>Status Code:</strong> <code>400 Bad Request</code></p>
            <pre>
  {
    "error": "Venue ID is required."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>404 Not Found</code></p>
            <pre>
  {
    "error": "Venue not found. Please check the venue ID."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>500 Internal Server Error</code></p>
            <pre>
  {
    "error": "An unexpected error occurred while fetching venue slots.",
    "details": "Error message details"
  }
            </pre>
          </div>
        </div>
  
        <div class="endpoint">
          <h2>3. Update Slot Status</h2>
          <p><strong>Endpoint:</strong> <code>POST /updateslot/venueid=:venueid/slotid=:slotid</code></p>
          <p><strong>Description:</strong> Updates the status of a specific parking slot (toggles between occupied and available).</p>
          <p><strong>Parameters:</strong></p>
          <ul>
            <li><code>venueid</code>: Unique ID of the venue (string).</li>
            <li><code>slotid</code>: ID of the slot to update (integer).</li>
          </ul>
          <p><strong>Response:</strong></p>
          <div class="response">
            <p><strong>Status Code:</strong> <code>200 OK</code></p>
            <pre>
  {
    "message": "Slot status updated successfully.",
    "slot": {
      "slotid": 1,
      "status": true,
      "carnumber": null
    }
  }
            </pre>
          </div>
          <p><strong>Error Responses:</strong></p>
          <div class="error">
            <p><strong>Status Code:</strong> <code>400 Bad Request</code></p>
            <pre>
  {
    "error": "Venue ID and Slot ID are required."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>400 Bad Request</code></p>
            <pre>
  {
    "error": "Invalid Slot ID. It must be a number."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>404 Not Found</code></p>
            <pre>
  {
    "error": "Venue not found. Please check the Venue ID."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>404 Not Found</code></p>
            <pre>
  {
    "error": "Slot not found. Please check the Slot ID."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>500 Internal Server Error</code></p>
            <pre>
  {
    "error": "An unexpected error occurred while updating the slot status.",
    "details": "Error message details"
  }
            </pre>
          </div>
        </div>
  
        <div class="endpoint">
          <h2>4. Block a Slot</h2>
          <p><strong>Endpoint:</strong> <code>GET /blockslot/venueid=:venueid/slotid=:slotid</code></p>
          <p><strong>Description:</strong> Blocks or unblocks a specific parking slot (toggles status).</p>
          <p><strong>Parameters:</strong></p>
          <ul>
            <li><code>venueid</code>: Unique ID of the venue (string).</li>
            <li><code>slotid</code>: ID of the slot to block/unblock (integer).</li>
          </ul>
          <p><strong>Response:</strong></p>
          <div class="response">
            <p><strong>Status Code:</strong> <code>200 OK</code></p>
            <pre>
  {
    "message": "Slot status updated successfully.",
    "slot": {
      "slotid": 1,
      "status": true,
      "carnumber": null
    }
  }
            </pre>
          </div>
          <p><strong>Error Responses:</strong></p>
          <div class="error">
            <p><strong>Status Code:</strong> <code>400 Bad Request</code></p>
            <pre>
  {
    "error": "Venue ID and Slot ID are required."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>400 Bad Request</code></p>
            <pre>
  {
    "error": "Invalid Slot ID. It must be a number."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>404 Not Found</code></p>
            <pre>
  {
    "error": "Venue not found. Please check the Venue ID."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>404 Not Found</code></p>
            <pre>
  {
    "error": "Slot not found. Please check the Slot ID."
  }
            </pre>
            <p><strong>Status Code:</strong> <code>500 Internal Server Error</code></p>
            <pre>
  {
    "error": "An unexpected error occurred while updating the slot status.",
    "details": "Error message details"
  }
            </pre>
          </div>
        </div>
      </body>
      </html>
    `);
});

app.post(
  '/register-venue/:name/:totalspots/:smartspots/:venueid',
  async (req, res) => {
    try {
      const { name, totalspots, smartspots, venueid } = req.params;

      // Validate Parameters
      if (!name || !totalspots || !smartspots || !venueid) {
        return res.status(400).json({ error: 'Missing required parameters.' });
      }

      const totalSpots = parseInt(totalspots, 10);
      const smartSpots = parseInt(smartspots, 10);

      if (isNaN(totalSpots) || totalSpots <= 0) {
        return res.status(400).json({
          error: 'Invalid totalspots value. It must be a positive integer.',
        });
      }

      if (isNaN(smartSpots) || smartSpots < 0 || smartSpots > totalSpots) {
        return res.status(400).json({
          error:
            'Invalid smartspots value. It must be a non-negative integer and less than or equal to totalspots.',
        });
      }

      // Check if the venue already exists
      const venueRef = db.collection('venues').doc(venueid);
      const venueDoc = await venueRef.get();
      if (venueDoc.exists) {
        return res.status(409).json({
          error:
            'Venue with this ID already exists. Please use a different ID.',
        });
      }

      // Generate Slot Data (Ensure status is stored as a boolean)
      let slots = Array.from({ length: smartSpots }, (_, i) => ({
        slotid: i + 1,
        status: Boolean(false), // Ensuring status is explicitly a boolean
        carnumber: null,
      }));

      // Save Venue Data to Firebase
      await venueRef.set({
        name,
        venueid,
        totalspots: totalSpots,
        smartspots: smartSpots,
        slots,
      });

      res.status(201).json({
        message: 'Venue registered successfully.',
        venue: {
          name,
          venueid,
          totalspots: totalSpots,
          smartspots: smartSpots,
        },
        slots,
      });
    } catch (error) {
      console.error('Error registering venue:', error);
      res.status(500).json({
        error: 'An unexpected error occurred while registering the venue.',
        details: error.message,
      });
    }
  }
);

app.get('/fetchslots/venueid=:venueid', async (req, res) => {
  try {
    const { venueid } = req.params;

    // Validate venueid
    if (!venueid) {
      return res.status(400).json({ error: 'Venue ID is required.' });
    }

    // Fetch venue data from Firebase
    const venueRef = db.collection('venues').doc(venueid);
    const venueDoc = await venueRef.get();

    if (!venueDoc.exists) {
      return res
        .status(404)
        .json({ error: 'Venue not found. Please check the venue ID.' });
    }

    // Extract venue data
    const venueData = venueDoc.data();

    res.status(200).json({
      message: 'Venue slots fetched successfully.',
      venue: {
        name: venueData.name,
        venueid: venueData.venueid,
        totalspots: venueData.totalspots,
        smartspots: venueData.smartspots,
        slots: venueData.slots,
      },
    });
  } catch (error) {
    console.error('Error fetching venue slots:', error);
    res.status(500).json({
      error: 'An unexpected error occurred while fetching venue slots.',
      details: error.message,
    });
  }
});

app.post('/updateslot/venueid=:venueid/slotid=:slotid', async (req, res) => {
  try {
    const { venueid, slotid } = req.params;

    // Validate venueid and slotid
    if (!venueid || !slotid) {
      return res
        .status(400)
        .json({ error: 'Venue ID and Slot ID are required.' });
    }

    // Convert slotid to a number
    const slotIdNumber = parseInt(slotid, 10);
    if (isNaN(slotIdNumber)) {
      return res
        .status(400)
        .json({ error: 'Invalid Slot ID. It must be a number.' });
    }

    // Fetch the venue document from Firestore
    const venueRef = db.collection('venues').doc(venueid);
    const venueDoc = await venueRef.get();

    // Check if the venue exists
    if (!venueDoc.exists) {
      return res
        .status(404)
        .json({ error: 'Venue not found. Please check the Venue ID.' });
    }

    // Get the venue data
    const venueData = venueDoc.data();

    // Find the slot to update
    const slots = venueData.slots;
    const slotIndex = slots.findIndex((slot) => slot.slotid === slotIdNumber);

    // Check if the slot exists
    if (slotIndex === -1) {
      return res
        .status(404)
        .json({ error: 'Slot not found. Please check the Slot ID.' });
    }

    // Toggle the slot's status
    slots[slotIndex].status = !slots[slotIndex].status;

    // Update the venue document in Firestore with the modified slots
    await venueRef.update({ slots });

    // Return the updated slot information
    res.status(200).json({
      message: 'Slot status updated successfully.',
      slot: {
        slotid: slotIdNumber,
        status: slots[slotIndex].status,
        carnumber: slots[slotIndex].carnumber, // Keeping carnumber as null for now
      },
    });
  } catch (error) {
    console.error('Error updating slot status:', error);
    res.status(500).json({
      error: 'An unexpected error occurred while updating the slot status.',
      details: error.message,
    });
  }
});

app.get('/blockslot/venueid=:venueid/slotid=:slotid', async (req, res) => {
  try {
    const { venueid, slotid } = req.params;

    // Validate venueid and slotid
    if (!venueid || !slotid) {
      return res
        .status(400)
        .json({ error: 'Venue ID and Slot ID are required.' });
    }

    // Convert slotid to a number
    const slotIdNumber = parseInt(slotid, 10);
    if (isNaN(slotIdNumber)) {
      return res
        .status(400)
        .json({ error: 'Invalid Slot ID. It must be a number.' });
    }

    // Fetch the venue document from Firestore
    const venueRef = db.collection('venues').doc(venueid);
    const venueDoc = await venueRef.get();

    // Check if the venue exists
    if (!venueDoc.exists) {
      return res
        .status(404)
        .json({ error: 'Venue not found. Please check the Venue ID.' });
    }

    // Get the venue data
    const venueData = venueDoc.data();

    // Find the slot to update
    const slots = venueData.slots;
    const slotIndex = slots.findIndex((slot) => slot.slotid === slotIdNumber);

    // Check if the slot exists
    if (slotIndex === -1) {
      return res
        .status(404)
        .json({ error: 'Slot not found. Please check the Slot ID.' });
    }

    // Toggle the slot's status
    slots[slotIndex].status = !slots[slotIndex].status;

    // Update the venue document in Firestore with the modified slots
    await venueRef.update({ slots });

    // Return the updated slot information
    res.status(200).json({
      message: 'Slot status updated successfully.',
      slot: {
        slotid: slotIdNumber,
        status: slots[slotIndex].status,
        carnumber: slots[slotIndex].carnumber, // Keeping carnumber as null for now
      },
    });
  } catch (error) {
    console.error('Error updating slot status:', error);
    res.status(500).json({
      error: 'An unexpected error occurred while updating the slot status.',
      details: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});

// const firebaseConfig = {
//     apiKey: "AIzaSyCyzSMxUAgBN_VA72MUN5RbbGNrbpRhTXI",
//     authDomain: "smartspot-11a20.firebaseapp.com",
//     projectId: "smartspot-11a20",
//     storageBucket: "smartspot-11a20.firebasestorage.app",
//     messagingSenderId: "929311044140",
//     appId: "1:929311044140:web:ab0462fd8f86dc090e5789",
//     measurementId: "G-DV84J80WJC"
//   };
