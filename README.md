# PlacePulse - A Community App for Sharing Place Experiences

![PlacePulse Logo](./frontend/public/PlacePulse.png)

## Overview
**PlacePulse** is a **community-driven web app** for discovering, reviewing, saving, and sharing real place experiences. Users can create an account, publish places with rich media, explore recent places, open detailed place pages, leave one review per place, organize saved places into collections, and use **AI-powered summaries**, **place Q&A**, and **semantic search** to find places that match what they are looking for.

The project is built with the **`MERN` stack** using **`React`**, **`Node.js`**, **`Express.js`**, **`MongoDB`**, and **`Mongoose`**. 

## Features

### **Authentication and session management**
- **Signup and login** are implemented with **`JWT`**-based authentication on the backend and a custom **`React Context`** + hook setup on the frontend.
- **Passwords** are hashed with **`bcryptjs`** before storage.
- **Auto-login** restores the session from **`localStorage`** after refresh and **Auto-logout** is triggered when the token expires.

### **Profile page and profile editing**
- The profile page shows the user’s **avatar**, **name**, **collections**, and **their places**.
- Users can **edit their profile name and avatar**.

### **Place browsing and management**
- Users can **create places** with **title**, **description**, **address**, **address notes**, **category**, **price level**, **tags**, and **media** (images/videos).
- **Address geocoding** converts a typed address into coordinates using **`Nominatim`** before saving.
- Users can **delete** and **edit** their own places, including changing metadata and updating the gallery using **`Mongoose`** transactions and file cleanup logic.
- Each place stores derived **review statistics** such as **average rating**, **review count**.
- Each place can be opened on an interactive **`Leaflet`** map in both cards and the details page.
- Places can be **shared** with a direct link using the browser sharing flow.

### **Media upload experience**
- The app supports **multi-image upload** for review photos, and **mixed media upload** for place galleries.
- Upload zones support **drag and drop** in addition to normal file picking.
- Users can **keep previously selected files**, **remove files before submit**, and preview content before saving.

### **Review system**
- Reviews include:
  - **star rating**
  - **comment**
  - **visit date**
  - **recommended-for tags**
  - **review photos**
- Users can **edit** and **delete** only their own reviews.

### **Collections and saved places**
- Users can **save a place** into one or more named **collections**.
- Users can **create collections**, **name them**, **delete them**, and **share them**.
- Shared collections have a public URL backed by a **share token** stored in the backend.

### **AI review summaries and place Q&A**
- Every place can generate an **AI review summary** by aggregating all reviews for that place and sending grounded review data to **`Gemini`**.
- The summary is cached in the backend and includes structured fields for:
  - **highlights**
  - **complaints**
  - **vibe**
  - **ideal audience**
  - **tips before visiting**
  - **price impression**
- The app also generates ready-to-use **preset answers** such as:
  - what people usually like
  - what people usually complain about
  - whether the place is good for **couples**, **families**, **work**, or **students**
  - whether it feels expensive
  - what the vibe is
- Users can also ask their own **custom questions** in a text box, and the backend answers them using the place summary plus review evidence.

### **Semantic search**
- The recent places page includes a **semantic search** box where users can describe the kind of place they want in natural language.
- Place metadata is embedded with **`Gemini embeddings`** using **`gemini-embedding-001`**.
- User queries are embedded with the same API and compared against stored place embeddings to return the most relevant matches.
- Embeddings are generated automatically when places are **created**, **updated**, and lazily backfilled for older places when search runs.

### **UI and reusable frontend architecture**
- The frontend uses reusable building blocks such as custom **form hooks**, **HTTP hooks**, upload components, **modals**, **cards**, **buttons**, and **navigation** components.
- Styling is driven by a centralized **theme system** with **CSS variables**.
- The app supports responsive layouts, interactive hover states, gallery transitions, and modal viewers for both place and review media.

### **Backend validation, integrity, and cleanup**
- Backend requests are validated with **`express-validator`**.
- Ownership checks ensure that only the correct user can modify or delete places, reviews, profile data, and collections.
- Related database writes that must stay in sync use **`Mongoose` transactions**.
- File cleanup runs when uploads fail, media is removed during edits, or related content is deleted.
- Environment-specific values such as the database connection string, authentication secret, and AI configuration are stored through **`dotenv`**.

## Demo

Video demo: https://youtu.be/5FG3nQJLeCY

## License

**Important Notice**: This repository is publicly available for viewing only.
Forking, cloning, or redistributing this project is NOT permitted without explicit permission.

