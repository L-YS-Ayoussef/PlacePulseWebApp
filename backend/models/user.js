const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;


const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 5 },
    image: { type: String, required: true },
    places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);

// About the [mongoose-unique-validator] -> 
// In the provided Mongoose schema definition, the uniqueValidator plugin is being applied using userSchema.plugin(uniqueValidator).This plugin is an external plugin called mongoose - unique - validator that adds pre - save validation for unique fields within a Mongoose schema.
// Here's how uniqueValidator works in your schema:
    // - Unique Constraint: In the email field definition, you have unique: true.This indicates that the email field must be unique across all documents in the User collection.If you try to save a document with a duplicate email address, Mongoose will throw a validation error.
    // - Plugin Integration: By adding userSchema.plugin(uniqueValidator), you integrate the mongoose - unique - validator plugin into your schema.This plugin enhances the default Mongoose validation by providing additional validation for unique fields.
    // - Pre - Save Validation: When you attempt to save a document using this schema, Mongoose will perform a pre - save validation check on fields marked as unique: true.If any of these fields are not unique, Mongoose will throw a validation error, preventing the document from being saved.
    // - Error Messages: If a validation error occurs due to a non - unique field, mongoose - unique - validator will provide a more detailed error message indicating which field is causing the uniqueness constraint violation.
// By using mongoose-unique - validator, you enhance the validation capabilities of your Mongoose schema, ensuring that fields marked as unique are indeed unique within the collection.It simplifies the process of handling uniqueness constraints and provides informative error messages for easier debugging.