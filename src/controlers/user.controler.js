import {asyncHandler} from  "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import  { User }  from  "../models/user.model.js"
import  {  uploadOnCloudinary } from "../utils/cloudinary.js"
import  {ApiResponse}  from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken =  async(userId)=>{
    try {
      const user  =  await  User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken=refreshToken;
      await user.save({  validateBeforeSave:false });

      return {accessToken,refreshToken}

    } catch (error) {
        throw new  ApiError(500,"Something went wrong while generating Access or Refresh token")
    }
}

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

});

const  loginUser  = asyncHandler(async (req,res)=>{
    //get user details  from  req.body-done
    //check length  of  user-done
    //check if user registerd or not-done
    //check password  correct or not-done
    //set refreshToken  &  accessToken
    //return user details with accessToken & refreshToken in  form of cookies
    //return to profile page  or home page

    const {email,username,password} = req.body
    

    if(!(req.body.username || req.body.email)){
        throw  new  ApiError(400,"username or email is missing")
    }

    const user= await  User.findOne({$or:[{username},{email}]});
    if(!user){
        throw new ApiError(404,"Email or username is wrong");
    }

    const  isPasswordCorrect = await user.isPasswordCorrect(password);
    if(!isPasswordCorrect){
        throw new ApiError(401,"Password is wrong");
    }

   const {accessToken,  refreshToken}= await generateAccessAndRefreshToken(user._id);

   const loggedInUser =  await User.findById(user._id).select("-password -refreshToken")

   const options={
    httpOnly:true,
    secure:true
   }

   return  res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"User logged in successfully"))



});

const  logoutUser  = asyncHandler(async (req,res)=>{
    //find user  by id
    //delete set cookies
    // reset refeshToken
     await User.findByIdAndUpdate(req.user._id,
        {
            $set:{ refreshToken:undefined}
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
       }
    
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
});

const  refreshAccessToken  = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
        const user  = await User.findById(decodedToken?._id);
    
        if(!user){
            throw  new  ApiError(401,"Invalid Refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(new  ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access token refreshed"));
    } catch (error) {
        throw new ApiError(401,error?.message,"Invalid refreshed token")
    }
});

const changeUserPassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword, confirmPassword} = req.body;

    if(!(newPassword  == confirmPassword)){
        throw new ApiError(400,"New password and confirm password must be same");
    }

    const user = User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400,"Ivalid Old Password");
    }
    

    user.password = newPassword;
    await user.save({validateBeforeSave:false});

    return  res.status(200).json(new ApiResponse(200,{},"Password changed successfully"));


});

const getCurrentUser =  asyncHandler(async (req,res)=>{
    return res.status(200).json(200,req.user,"current user fetch successfully");
});

const updateAccountDetail  = asyncHandler(async (req,res)=>{
    const {fullname,email} = req.body;

    if(!fullname ||  !email){
        throw new ApiError(400,"Please fill all the fields");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set: {fullname,email}},
        {new:true}
    ).select("-password");

    //Also can do like this
    // user.fullname=fullname;
    // user.email=email;
    // user.save({validateBeforeSave:false});

    return res.status(200).json(new  ApiResponse(200,user,"Account details updated successfully"));

})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.files?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Please upload an image");
    }
        const avatar= await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
            throw new ApiError(400,"Failed to upload image on cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:
            {
                avatar:avatar.url
            }
        },
        {new:true})
        .select("-password");
    
    return res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"));
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.files?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Please upload an image");
    }
        const coverImage= await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
            throw new ApiError(400,"Failed to upload image on cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:
            {
                coverImage:coverImage.url
            }
        },
        {new:true})
        .select("-password");
    
    return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"));
})



export {registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     getCurrentUser,
     changeUserPassword,
     updateAccountDetail,
     updateUserAvatar,
     updateUserCoverImage
    }