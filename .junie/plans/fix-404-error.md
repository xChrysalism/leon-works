---
sessionId: session-261004-221117-kfvz
---

# Issue

### Problem
User sees a "404 Not Found" error when trying to access the website.

### Root Cause
The dev server is running on **port 3001** (not 3000) because port 3000 was already occupied by a previous server instance. If the user opens `http://localhost:3000`, they'll get a 404 or a stale page.

### Solution
Open **http://localhost:3001** in your browser to see the Marina website.

# Delivery Steps

### ✓ Step 1: Verify the correct port
Confirm the dev server is running and identify the correct port.

### ✓ Step 2: Guide the user to the right URL
Inform the user to open http://localhost:3002 instead of 3000.