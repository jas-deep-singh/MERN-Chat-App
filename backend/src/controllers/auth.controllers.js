import { asyncHandler } from "../utils/asyncHandler.utils.js";
import User from "../models/user.models.js";
import { apiError } from "../utils/apiError.utils.js"
import { apiResponse } from "../utils/apiResponse.utils.js"; 
import cloudinary from "../lib/cloudinary.js";

const generateAccessRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};
    } catch(error) {
        throw new apiError(500, "Something went wrong while generating access & refresh tokens: ", error);
    }
}

const userSignUp = asyncHandler(async(req, res) => {
    const {fullName, email, password} = req.body;
    if(!fullName || !email || !password) {
        throw new apiError(400, "All fields must be provided");
    }
    if(password.length<6) {
        throw new apiError(400, "Password must be atleast 6 characters");
    }
    const existingUser = await User.findOne({email});
    if(existingUser) {
        throw new apiError(409, "User with given email already exists");
    }
    const user = await User.create({
        fullName,
        email,
        password
    });
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    }
    const {accessToken, refreshToken} = await generateAccessRefreshToken(user._id);
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser) {
        throw new apiError(500, "Something went wrong while registering the user");
    }
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
              .json(new apiResponse(200, "User registered successfully", createdUser));
});

const userLogIn = asyncHandler(async(req, res) => {
    const {email, password} = req.body;
    if(!email || !password) {
        throw new apiError(400, "All fields are required");
    }
    const user = await User.findOne({email});
    if(!user) {
        throw new apiError(404, "User not found");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid) {
        throw new apiError(401, "Invalid credentials");
    }
    const {accessToken, refreshToken} = await generateAccessRefreshToken(user._id);
    const options = {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production"
    }
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    if(!loggedInUser) {
        throw new apiError(500, "Error fetching user");
    }
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
              .json(new apiResponse(200, "User logged in successfully", {user: loggedInUser}));
});

const userLogOut = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {new: true}
    );
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    }
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options)
              .json(new apiResponse(200, "User logged out successfully"));
});

const updateProfilePic = asyncHandler(async(req, res) => {
    const {profilePic} = req.body;
    if(!profilePic) {
        throw new apiError(400, "Profile pic is required");
    }
    const uploadProfilePic = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            profilePic: uploadProfilePic.secure_url 
        },
        {new: true}
    );
    return res.status(200).json(new apiResponse(200, "Profile pic updated successfully", updatedUser));
});

const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch(error) {
        console.log("Error in checkAuth controller ", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export {userSignUp, userLogIn, userLogOut, updateProfilePic, checkAuth};