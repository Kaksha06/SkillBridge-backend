import User from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const registerUser = asyncHandler(async (req, res) => {
    // Get user details from frontend
    const { id, name, email, password, role, skills, location, bio } = req.body;
    
    // Validation - check if required fields are not empty
    if ([id, name, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ id }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with this ID or email already exists");
    }

    // Create user object and save to DB
    const user = await User.create({
        id,
        name,
        email: email.toLowerCase(),
        password,
        role: role || 'volunteer', // Default role is 'volunteer' if not specified
        skills: skills || [],
        location: location || '',
        bio: bio || ''
    });

    // Remove sensitive fields before sending response
    const createdUser = await User.findOne({ id }).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Generate JWT token
    const token = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to user document
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set refresh token in HTTP-only cookie
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    };

    // Return success response with user data and tokens
    return res
        .status(201)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                201,
                {
                    user: createdUser,
                    accessToken: token
                },
                "User registered successfully"
            )
        );
})

const loginUser = asyncHandler(async (req, res) => {
    // Get email/username and password from request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if password is correct
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate access and refresh tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to user document
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Get user details without sensitive data
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Set refresh token in HTTP-only cookie
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    // Return success response with user data and tokens
    return res
        .status(200)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken
                },
                "User logged in successfully"
            )
        );
});

export {
    registerUser,
    loginUser
}
