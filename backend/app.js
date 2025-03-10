require("dotenv").config();
const fs = require("fs"); // importing the module "fs" so that we can delete the file uploaded and there is an error 
const path = require("path");
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

// Handling Data sent from forms
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));
app.use(bodyParser.json());

// Handling CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');

    next();
});

// Middlewares
// When defining the routes in the app here is the way -> The folder [controllers] exports the action methods(will be done after getting the request) that will be imported in the folder [routes] and this folder will export the [router](which contains the specific routes and their methods [GET, POST, ..] and the action after getting this route), then the exported [router] will be imported in the main file of the application -> [app.js]
app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

// Route Not Found 
app.use((req, res, next) => {
    const error = new HttpError('Could not find this route.', 404);
    throw error;
});

// Error-Handling 
app.use((error, req, res, next) => {
    // deleting the file uploaded which is stored inside the folder "images" which is inside the folder "uploads", this file will be deleted if there is an error   
    // checking first of there is a file -> 
    if (req.file) { // multer add the file property  to the request object 
        fs.unlink(req.file.path, err => {  // The "unlink" method in the fs(File System) module is used to delete a file from the file system. It's an asynchronous method that takes a file path and a callback function that gets called once the file is deleted or if an error occurs.
            console.log(err);
        }); 
    } 

    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500)
    res.json({ message: error.message || 'An unknown error occurred!' });
});

// Notes -> 
// [res.headerSent] -> is a property in Express.js that indicates whether the response headers have been sent to the client. If the headers have already been sent, it typically means that the response has already been partially or fully processed. Checking [res.headerSent] allows you to handle errors that occur after headers have been sent in a way that avoids sending additional headers or modifying the response.
// If res.headerSent is true, it means that the response headers have already been sent, so you cannot send additional headers or modify the response. In this case, calling next(error) will delegate the error handling to the next error - handling middleware in the chain or to the default error handler provided by Express.js.

// DB Connection
mongoose
    .connect(process.env.DATABASE_URL)
    .then(() => {
        app.listen(5000);
    })
    .catch(err => {
        console.log(err);
    });


// Note -> The differene between [throw new Error] and [return next(error)] -> 
// 1) [throw new Error()] is a mechanism used to throw an error synchronously in JavaScript code. When you throw an error, it interrupts the normal flow of execution and immediately exits the current function or block. This mechanism is commonly used to handle synchronous errors in your application logic.
// 2) [next(error)] is typically used in middleware functions in Express.js to pass an error to the next middleware or error-handling middleware in the chain. It's part of Express.js's error handling mechanism, where you can define custom error - handling middleware to handle errors that occur during request processing. When you call next(error), Express.js will skip to the next error - handling middleware defined in your application. This mechanism is commonly used to handle asynchronous errors that occur during request processing.

// Notes about deleting or removing in node.JS --> 
// Here is a list of some common methods in the fs module related to file operations:
    // fs.unlink(path, callback): Asynchronously deletes a file.
    // fs.unlinkSync(path): Synchronously deletes a file.
    // fs.rm(path, options, callback): Asynchronously removes files or directories.Added in Node.js v14.14.0.
    // fs.rmSync(path, options): Synchronously removes files or directories.Added in Node.js v14.14.0.
    // fs.rmdir(path, callback): Asynchronously removes an empty directory.
    // fs.rmdirSync(path): Synchronously removes an empty directory.
    // fs.readdir(path, callback): Reads the contents of a directory.

// The difference between delete using the method "unlink" and using the method "rm" --> 
    // 1) fs.unlink(Delete) -->
        // Purpose: Specifically designed to delete a single file.
        // Scope: Limited to files only.
        // Functionality: Removes the specified file from the file system.

    // 2) fs.rm(Remove) -->
        // Purpose: Designed to remove files or directories.
        // Scope: Can remove both files and directories(including non - empty directories when options are provided).
        // Functionality: Removes the specified file or directory from the file system.
        // Options: Provides additional options to handle directories(e.g., recursive deletion).


// Note about the "delete" keyword in js --> 
    // "delete" in JavaScript -->
        // Purpose: The delete operator in JavaScript is used to remove a property from an object.
        // Usage: It's used to delete properties from objects, and it does not delete the actual object itself. It returns true if the property is successfully deleted, and false otherwise.
        // Example -->

            // const obj = {
            //     property1: 'value1',
            //     property2: 'value2'
            // };
            // delete obj.property1;
            // console.log(obj); // { property2: 'value2' }














// Kingston, New York