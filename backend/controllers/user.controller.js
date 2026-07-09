import { uploadImageBuffer } from "../services/cloudinary.service.js";
import {
  skipUserProfile,
  updateUserProfile,
} from "../services/userAuth.service.js";

export const saveMyProfile = async (req, res, next) => {
  try {
    const user = await updateUserProfile({
      userId: req.user.id,
      body: req.body || {},
    });
    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const skipMyProfile = async (req, res, next) => {
  try {
    const user = await skipUserProfile({ userId: req.user.id });
    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const uploadMyProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "image file is required." });
    }

    const result = await uploadImageBuffer(req.file.buffer, req.file.originalname);
    const user = await updateUserProfile({
      userId: req.user.id,
      body: {
        modelImageUrl: result.secure_url,
        modelImagePublicId: result.public_id,
      },
    });

    return res.status(201).json({
      success: true,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      user,
    });
  } catch (error) {
    next(error);
  }
};
