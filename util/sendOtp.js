const nodemailer = require("nodemailer");
require('dotenv').config();
const { AUTH_EMAIL, AUTH_PASS} = process.env;

const transporter=nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user:AUTH_EMAIL,
        pass:AUTH_PASS,
    }
})
transporter.verify((error,success)=>{
    if(error){
        console.log(error);
    }else{
        console.log("email ready");
        console.log(success);
    }
})
const sendEmail=async (mailOptions)=>{
    try{
        await transporter.sendMail(mailOptions)
        console.log("Email sent");
        
       
    }catch(err){
    console.error("Error sending email:",err);
    }
}

module.exports=sendEmail;

