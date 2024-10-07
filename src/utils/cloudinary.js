import { v2 as cloudinary } from 'cloudinary';
import  fs from 'fs';

// Configuration
cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});
    
const  uploadOnCloudinary=  async (localFilePath) => {
    try {
        if(!localFilePath)  return  null;
        //Upload  on  cloudinary
        const  response = await  cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)  //REMOVE LOCAL SAVED temporary file if not uploaded successfully
        return  null;
    }
    
}

export  {uploadOnCloudinary}