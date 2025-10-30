import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
            lowercase: true,
            // match: [/.+@.+\..+/, 'Please fill a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        refreshToken: {
            type: String
        },
        role: {
            type: String,
            required: true,
            enum: ['volunteer', 'NGO'], 
            default: 'volunteer'
        },
        skills: {
            type: [String],
            default: [],
        },
        location: {
            type: String,
            trim: true,
        },
        bio: {
            type: String,
            maxlength: 300
        },
        organisation_name: {
            type: String,
            trim: true
        },
        organization_description: {
            type: String,
            maxlength: 2000,
        },
        website_url: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true
    }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare password
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            id: this.id,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d'
        }
    );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d'
        }
    );
};

export default mongoose.model('User', userSchema);