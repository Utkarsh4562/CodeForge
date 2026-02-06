const validator = require("validator");  // ye uske liye jo abhi install kia npm i validator 
const validate= (data )=>{  // data is bassically req.body jo user se a araha hai jo maine likha tha register function me user.Auth.js file me 
const mandatoryField = ["firstName","emailId","password"]; // ye wo field hai jo mandotary hai user ko register karne ke liye 

const Isallowed = mandatoryField.every((k)=> Object.keys(data).includes(k)); // ye check karne ke liye jo user ne sabhi mandatory field di hai ya nahi and k means data ya mana data ka naam k hai 
if(!Isallowed)
    throw new Error("Some Field is missing");

if(!validator.isEmail(data.emailId)) // agar email jo data.email me hai aur vo valid nahi hai to error throw kar denge 
 throw new Error("invalid EmailId");

if(!validator.isStrongPassword(data.password))
    throw new Error("password is week");

return true;
}
module.exports = validate;

