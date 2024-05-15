const transporter = require('../config/nodemailer');

const verifyEmail = async (email, fullname, link) => {
    try {
        return await transporter.sendMail({
            from: '"SecureChaApplication👻" <77spencerradcliff77@gmail.com>', // sender address
            to: email, // list of receivers
            subject: "Confirm your email address ✔", // Subject line
            text: "Hello world?", // plain text body
            html: `
                <div>
                    <p>Dear ${fullname},</p>
                    <p>Thank you for signing up to secure chat application</p>

                    <p>To confirm your registration, please click on the link below:</p>
                    <a href="${link}">Click to confirm</a>
                </div>
            `, // html body
        });
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
    }
};


module.exports = {verifyEmail}