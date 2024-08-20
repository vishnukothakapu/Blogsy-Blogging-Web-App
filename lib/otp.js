const otpGen = ()=> {
    let numbers = '0123456789';
    let length = 4;
    let otp = "";
    for (let i = 0; i < length; i++) {
        const index = Math.floor(Math.random() * numbers.length);
        otp += numbers[index];
    }
    return otp;
}
module.exports = otpGen;