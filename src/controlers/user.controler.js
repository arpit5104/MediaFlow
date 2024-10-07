import {asyncHandler} from  "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import  { User }  from  "../models/user.model.js"
import  {  uploadOnCloudinary } from "../utils/cloudinary.js"
import  {ApiResponse}  from "../utils/ApiResponse.js"
import { upload } from "../middlewares/multer.middleware.js";

const registerUser = asyncHandler(async (req,res)=>{
    //get user details from frontend-done
    //validtion -   not empty-done
    //user alredy exist: username or  email-done
    //check for images-done
    //upload to cloudinary:multer to local then local to cloudnary-done
    //create user object-entry in db-done
    //remove password and refresh token field from  response-done
    //check for user created-done
    // return res

    const {fullname,email,password,username} = req.body;
    

    //Advance Code to check allthe field simultaneously
    // if([fullname,email,username,password].some((field)=>field?.trim()=== "")){
    //     throw new ApiError(400,"All fields are required");
    // }

    // Also do like this
    if(fullname==="" ||  email==="" || username==="" || password===""){
        throw new ApiError(400,"All fields are required");
    }
    

    const existedUser=  await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409,"User already exist");
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;  //Advance checking but will throw error if it doesnot have coverImage

    let coverImageLocalPath;
    if(req.files  &&  Array.isArray(req.files.coverImage)  &&  req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400,"Avatar upload failed");
    }

    const user  = await User.create({
        fullname,
        email,
        username:username.toLowerCase(),
        password,
        avatar:avatar.url,
        coverImage: coverImage?.url || ""
    })
    

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user");
    }

    return  res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successfully")
    )

})


export {registerUser}