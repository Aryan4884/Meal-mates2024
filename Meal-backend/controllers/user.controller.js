import jwt from "jsonwebtoken";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Stripe from "stripe";
import { Vonage } from "@vonage/server-sdk";
import { Complaint } from "../models/complaints.model.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const getAllUser = async (req, res) => {
  try {
    const user = await User.find();
    //console.log(user);
    res.status(200).json({ user });
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fetching all users");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exist: username, email
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res
  const { email, password, fullname, username, role } = req.body;

  // check if any field is empty
  if (
    [email, fullname, username, password, role].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if there is existing user with this email, username
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    throw new ApiError(409, "User exist with this email/username");
  }

  // creating user obj
  const user = await User.create({
    email,
    fullname,
    password,
    role,
    username: username.toLowerCase(),
  });

  // removing password and refreshToken from db as it is not required
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // returning response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookie

  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User looged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRECT
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// Change password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changes successfully"));
});

// Get current User details
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

const getPaymentDetails = asyncHandler(async (req, res) => {
  try {
    const paymentList = await Payment.find();
    console.log("Payment Details given by the user: ", paymentList);
    return res.status(200).json({
      success: true,
      msg: "Payment Details given by the user",
      paymentList,
    });
  } catch (error) {
    console.error("Error fetching details: ", error);
    return res.status(500).json({
      success: false,
      msg: "Error fetching details",
      error: error.message,
    });
  }
});

const makePayment = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECONDARY_KEY);
  const { name, email, amount, message } = req.body;

  if (!amount) {
    return res.status(400).json({
      success: false,
      msg: "Amount is required",
    });
  }

  try {
    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Custom Payment",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        name: name,
        message: message,
      },
      success_url: "http://localhost:5173/success",
      cancel_url: "http://localhost:5173/cancel",
    });
    const newPayment = new Payment({
      name,
      email,
      amount,
      message,
    });
    console.log("Request body: ", req.body);
    const newPaymentData = await newPayment.save();
    console.log("Payment Details: ", newPaymentData);
    res.json({ id: session.id, success: true });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Error creating checkout session." });
  }
};

// register food complaint
const registerFoodComplaint = asyncHandler(async (req, res) => {
  const {
    locality,
    foodType,
    latitude,
    longitude,
    foodDescription,
    date,
    mobileNo,
    selectedImage,
    mapAPI,
  } = req.body;
  const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_SECRET_KEY,
  });
  const from = "Meal Mates Community";
  const to = `${mobileNo}`;
  const text = "Your food complaint is registered successfully!!";
  await vonage.sms
    .send({ to, from, text })
    .then((resp) => {
      console.log("Message sent successfully");
      console.log(resp);
    })
    .catch((err) => {
      console.log("There was an error sending the messages.");
      console.error(err);
    });

  const newComplaint = new Complaint({
    locality,
    foodType,
    latitude,
    longitude,
    foodDescription,
    date,
    mobileNo,
    selectedImage,
    mapAPI,
  });
  console.log("Request body: ", req.body);
  const complaintData = await newComplaint.save();
  console.log("Complaint Data: ", complaintData);
  return res.status(200).json({
    success: true,
    msg: "Complaint Registered successfully!",
    complaintData,
  });
});

// getting all food complaints
const getFoodComplaints = asyncHandler(async (req, res) => {
  try {
    const complaintsList = await Complaint.find();
    console.log("Here are the list of registered complaints: ", complaintsList);
    return res.status(200).json({
      success: true,
      msg: "List of registered complaints by the residents",
      complaintsList,
    });
  } catch (error) {
    console.error("Error fetching complaints: ", error);
    return res.status(500).json({
      success: false,
      msg: "Error fetching complaints",
      error: error.message,
    });
  }
});

export {
  changeCurrentPassword,
  getPaymentDetails,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  makePayment,
  getAllUser,
  registerFoodComplaint,
  getFoodComplaints,
};
