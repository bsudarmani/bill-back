const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const app=express();
const UserModel=require('./models/UserModel');
app.use(express.json());
app.use(cookieParser())
app.use(cors(
    {
        origin:['http://localhost:5173'],
        credentials:true
    }
));
mongoose.connect('mongodb://localhost:27017/jwt-form')
app.get('/get',(req,res)=>
{
res.send("get method")
})
app.post('/register', (req, res) => {
    const {name, email, password} = req.body;
    UserModel.create({name, email, password})
    .then(user => res.json(user))
    .catch(err => res.json(err))
})

app.post('/login',(req,res)=>
{
    const{email,password}=req.body;
    UserModel.findOne({email}).then(user=>{
        if(user)
        {
            if(user.password==password)
            {
                const accessToken=jwt.sign({email:email},
                    "jwt-access-token-secret-key",{expiresIn:'1m'})
                const refreshToken=jwt.sign({email:email},
                    "jwt-refresh-token-secret-key",{expiresIn:'5m'})
                res.cookie('accessToken',accessToken,{maxAge:60000})
                res.cookie('refreshToken',refreshToken,{maxAge:300000,httpOnly:true,secure:true,sameSite:'strict'})
                return res.json({Login:true});
            }
        }
        else
        {
            res.json({Login:false,Message:"No record"});
        }
    }).catch(err=>res.json(err))
})

const varifyUser = (req, res, next) => {
    const accesstoken = req.cookies.accessToken;
    if(!accesstoken) {
        if(renewToken(req, res)) {
            next()
        }
    } else {
        jwt.verify(accesstoken, 'jwt-access-token-secret-key', (err ,decoded) => {
            if(err) {
                return res.json({valid: false, message: "Invalid Token"})
            } else {
                req.email = decoded.email
                next()
            }
        })
    }
}

const renewToken = (req, res) => {
    const refreshtoken = req.cookies.refreshToken;
    let exist = false;
    if(!refreshtoken) {
        return res.json({valid: false, message: "No Refresh token"})
    } else {
        jwt.verify(refreshtoken, 'jwt-refresh-token-secret-key', (err ,decoded) => {
            if(err) {
                return res.json({valid: false, message: "Invalid Refresh Token"})
            } else {
                const accessToken = jwt.sign({email: decoded.email}, 
                    "jwt-access-token-secret-key", {expiresIn: '1m'})
                res.cookie('accessToken', accessToken, {maxAge: 60000})
                exist = true;
            }
        })
    }
    return exist;
}

app.get('/dashboard',varifyUser, (req, res) => {
    return res.json({valid: true, message: "authorized"})
})

app.listen(4000,()=>{
    console.log(`port runnning on 4000`)
})