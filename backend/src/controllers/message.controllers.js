import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { apiError } from "../utils/apiError.utils.js";
import { apiResponse } from "../utils/apiResponse.utils.js";
import User from "../models/user.models.js";
import Message from "../models/message.models.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const getUsersForSidebar = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    if(!filteredUsers) {
        return new apiError(500, "error getting users", error)
    }
    res.status(200).json(filteredUsers);
});

const getMessages = asyncHandler(async (req, res) => {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    res.status(200).json(messages);
});

const sendMessage = asyncHandler(async(req, res) => {
    const {text, image} = req.body;
    const {id: receiverId} = req.params;
    const myId = req.user._id;
    console.log("TEXT AND IMAGE : ", text, image);
    console.log("MYID : ", myId); 
    console.log("RECEIVER ID : ", receiverId);
    let imageUrl;
    if(image) {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
        senderId: myId,
        receiverId,
        text, 
        image: imageUrl
    });
    console.log("CREATED MESSAGE : ", newMessage);

    //realtime chatting 
    const receiverSocketId = getReceiverSocketId(receiverId);
    console.log("RECEIVER SOCKET ID : ", receiverSocketId);
    console.log("IO : ", io);
    await newMessage.save();
    if(receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.status(200).json(new apiResponse(200, "message sent successfully", newMessage));
});

export {getUsersForSidebar, getMessages, sendMessage};