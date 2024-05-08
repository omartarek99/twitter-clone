import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {

    const {username} = req.params;

    try {
        const user = await User.findOne({username}).select("-password");
        if(!user)  return res.status(404).json({error: "User not found"});
  
        return res.status(200).json(user);
    }
    catch (error) {
        console.log("error in getUserProfile", error.message);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

export const followUnfollowUser = async (req, res) => {
	try {
		const { id } = req.params;
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (id === req.user._id.toString()) {
			return res.status(400).json({ error: "You can't follow/unfollow yourself" });
		}

		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

		const isFollowing = currentUser.following.includes(id);

		if (isFollowing) {
			// Unfollow the user
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

			res.status(200).json({ message: "User unfollowed successfully" });
		} else {
			// Follow the user
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
			// Send notification to the user
            const newNotification = new Notification ({
                type: "follow",
                from: req.user._id,
                to: userToModify._id,
            });
            await newNotification.save();

			
			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (error) {
		console.log("Error in followUnfollowUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const getSuggestedUsers = async (req, res) => {

    try {
        const userId = req.user._id;

        const usersFollowedByMe = await User.findById(userId).select("following");

        const users = await User.aggregate([

            {
                $match:{
                    _id: {$ne: userId},
                }
            },
            {$sample:{size:10}},
        ])

        const filteredUsers = users.filter(user=>!usersFollowedByMe.following.includes(user._id))
        const suggestedUsers = filteredUsers.slice(0,4);

        suggestedUsers.forEach(user => (user.password=null));

        res.status(200).json(suggestedUsers);

    }

    catch(error) {
        console.log("Error in getSuggestedUsers: ", error.message);
        res.status(500).json({ error: error.message });

    }

}

export const updateUser = async (req, res) => {
    const {fullName, email, password, currentPassword, newPassword, bio, link} = req.body;
        let {profileImg,coverImg} = req.body
        const userId = req.user._id;
    try {

        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        
        if((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
            return res.status(400).json({ error: "Please provide both current Password and new Password" });
        }

        if(currentPassword && newPassword) {

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if(!isMatch) {
                return res.status(400).json({ error: "Current Password is incorrect" });
            }
            if(newPassword.length < 6) {
                return res.status(400).json({ error: "New Password must be at least 6 characters long" });
            }

            const salt = await bcrypt.genSalt(10);
            user.passwords = await bcrypt.hash(newPassword, salt);

        }

    }
     catch (error) {
        console.log("Error in updateUser: ", error.message);
        res.status(500).json({ error: error.message });
    }
};