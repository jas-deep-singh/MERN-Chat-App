import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { apiError } from "../utils/apiError.utils.js";
import { apiResponse } from "../utils/apiResponse.utils.js";
import User from "../models/user.models.js";
import Message from "../models/message.models.js";
import cloudinary from "../lib/cloudinary.js";

const getUsersForSidebar = asyncHandler(async(req, res) => {
    const filteredUsers = await User.find({_id: {$ne: req.user._id}}).select("-password -refreshToken");
    if(!filteredUsers) {
        throw new apiError(500, "Internal server error. Cannot fetch users");
    }
    return res.status(200).json(new apiResponse(200, "Users fetched successfully", {filteredUsers}));
});

const getMessages = asyncHandler(async(req, res) => {
    const {id: userToChatId} = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
        $or: [
            {senderId: myId, receiverId: userToChatId},
            {senderId: userToChatId, receiverId: myId}
        ]
    });
    if(!messages) {
        throw new apiError(500, "Internal server error. Cannot fetch messages");
    }
    return res.status(200).json(new apiResponse(200, "Messages fetched successfully"));
});

const sendMessage = asyncHandler(async(req, res) => {
    const {text, image} = req.body;
    const {id: receiverId} = req.params;
    const myId = req.user._id;
    let imageUrl;
    if(image) {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
        myId,
        receiverId,
        text, 
        image: imageUrl
    });
    const sentMessage = await newMessage.save();
    if(!sentMessage) {
        throw new apiError(500, "Internal server error. Error sending message");
    }
    res.status(200).json(new apiResponse(200, "message sent successfully", sentMessage));
});

export {getUsersForSidebar, getMessages, sendMessage};