const jwt = require('jsonwebtoken');
const JWT_SECRET = ".envFile/configFile";

const fetchuser = (req, res, next)=>{

    // Get the user from jwt token and append it to req object.
    try {
        const token = req.header('auth-token');

        if(!token){
            return res.status(401).json({error: "Authenticate the user using valid token"});
        }
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;

        next();
    } catch (error) {
        
        console.log("token");
        return res.status(401).json({error: "Authenticate the user using valid token"});
    }
    
}

module.exports = fetchuser;