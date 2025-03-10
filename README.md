# PlacePulse - A Social Platform for Sharing Places

## 🌍 Overview
**PlacePulse** is a web application designed to allow users to **share places they have visited** with others. Users can **sign up, log in, upload images, provide a title, description, and address for a place**, and explore locations shared by others. The platform encourages a community-driven approach to discovering new places, complete with **interactive maps** for visualizing shared locations.

This project is built using the **MERN stack** (MongoDB, Express.js, React.js, Node.js) with **Redux for state management**.

---

## 🚀 Features
### 👤 User Features:
- **User Authentication**: Signup & login with token-based authentication.
- **Share Places**: Upload an image, title, description, and address of a place.
- **Edit & Delete Places**: Edit and delete places only by the user created them.
- **View Shared Places**: Browse places shared by other users.
- **Interactive Map**: View location details using a mapping API.
- **Secure Sessions**: Tokens stored locally for managing user sessions.

### 🔧 Security Features:
- **Input Validation**: Ensuring data consistency on both frontend & backend.
- **Environment Variables**: Securely stores sensitive configuration details.

---

## 🛠 Technologies Used
### **Backend (Node.js & Express.js)**
- **MongoDB & Mongoose** (Database for storing users, places, and sessions)
- **Express.js** (Framework for building RESTful APIs)
- **JWT (JSON Web Token)** (Authentication & session management)
- **bcryptjs** (Hashing passwords)
- **Multer** (Middleware for handling image uploads)
- **dotenv** (For managing environment variables)
- **express-validator** (Input validation in backend)

### **Frontend (React.js)**
- **React.js with Redux** (For managing complex state efficiently)
- **React Router** (For navigation and dynamic routing)
- **Map API Integration** (For displaying locations on a map)
- **Styled Components / CSS Modules** (For responsive design)

---

## 💡 Skills Used
### 1️⃣ **Building RESTful APIs**
- Developed a fully functional backend with **Express.js and Mongoose**.
- CRUD operations for managing users and places.

### 2️⃣ **Authentication with Token-Based Sessions**
- Used **JWT** for authentication, ensuring secure user sessions.
- Tokens are stored **locally** to persist user login status.

### 3️⃣ **Managing Complex State with Redux**
- Implemented **Redux Toolkit** to efficiently manage the application state.
- Used Redux for user authentication, form submissions, and place sharing.

### 4️⃣ **Input Validation (Frontend & Backend)**
- **Frontend:** Used form validation to ensure proper data entry.
- **Backend:** Implemented validation in Express.js to prevent incorrect data submissions.

### 5️⃣ **Map API for Address Viewing**
- Integrated a **mapping API** to allow users to view locations they share.
- Converts text-based addresses into interactive map pins.

### 6️⃣ **Image Upload Using Multer**
- Enabled **image uploads** for places using Multer.
- Stores images securely in the file system or cloud storage.

### 7️⃣ **Environment Variables for Security**
- Used `.env` file to store:
  - Database connection strings
  - API keys (for maps, authentication, etc.)

---

## 🖼️ App Screenshots

### Signup Page
![Signup Page](https://github.com/L-YS-Ayoussef/PlacePulseWebApp/blob/master/screenshots/Screenshot1.png)

### Login Page
![Login Page](https://github.com/L-YS-Ayoussef/PlacePulseWebApp/blob/master/screenshots/Screenshot2.png)

### Home Page
![Home Page](https://github.com/L-YS-Ayoussef/PlacePulseWebApp/blob/master/screenshots/Screenshot3.png)

### Add Place Page
![Add Place](https://github.com/L-YS-Ayoussef/PlacePulseWebApp/blob/master/screenshots/Screenshot4.png)

### Places Page
![Places Page](https://github.com/L-YS-Ayoussef/PlacePulseWebApp/blob/master/screenshots/Screenshot5.png)

### Users Page
![User Dashboard](https://github.com/L-YS-Ayoussef/PlacePulseWebApp/blob/master/screenshots/Screenshot6.png)

---

## 📜 License
This project was built for **learning and development purposes**. It is **not a commercial product** and is **closed source**.

Cloning or forking this repository **requires explicit permission**.

📌 **Copyright © 2025 Chameleon Tech**

---
Developed with ❤️ by the Chameleon Tech 🌍📍

