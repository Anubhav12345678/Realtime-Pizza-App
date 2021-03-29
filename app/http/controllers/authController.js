const User = require('../../models/user')
const bcrypt = require('bcrypt')
const passport = require('passport')
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
function authController() {

    const randString = () => {
        // const len=100
        let randStr = uuidv4();
        // for(let i=0;i<len; i++){
        //     const ch = Math.floor((Math.random() * 100) + 1)
        //     randStr+=ch
        // }
        return randStr
    }

    // send Mail fun is starting

     const sendEmail = (email, uniqueString)=>{
        const Transport = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.MY_GMAIL_USERID,
                pass: process.env.MY_GMAIL_PASS
            }
        });

        var mailOptions;
        let sender = 'Anubhav';
        mailOptions = {
            from: 'no-reply@gmail.com',
            to: email,
            subject: "Email Confirmation",
            text: 'Hello user, Hope you are doing well, Thank you very much for registering with our service.',
            html: `Hello user, Hope you are doing well, Thank you very much for registering with our service. <br>Press <a href=http://localhost:3000/verify/${uniqueString}> here </a> to verify your email. Thanks`
        };

        Transport.sendMail(mailOptions, function(err, response){
            if(err){
                console.log(err)
            } else {
                console.log("mssg sent via nodemailer!!!!!!!!!");
            }
        })

     }

    // send mail function is ending

    const _getRedirectUrl = (req) => {
        return req.user.role === 'admin' ? '/admin/orders' : '/customer/orders'
    }
    
    return {
        login(req, res) {
            res.render('auth/login')
        },
        postLogin(req, res, next) {
            const { email, password }   = req.body
           // Validate request 
            if(!email || !password) {
                req.flash('error', 'All fields are required')
                return res.redirect('/login')
            }
            passport.authenticate('local', (err, user, info) => {
                if(err) {
                    req.flash('error', info.message )
                    return next(err)
                }
                if(!user) {
                    req.flash('error', info.message )
                    return res.redirect('/login')
                }

                if(!user.confirmed) {
                    console.log("Confirm your email");
                    return new Error("Please confirm your email to login!!");
                }

                req.logIn(user, (err) => {
                    if(err) {
                        req.flash('error', info.message ) 
                        return next(err)
                    }

                    return res.redirect(_getRedirectUrl(req))
                })
            })(req, res, next)
        },
        register(req, res) {
            res.render('auth/register')
        },
        async postRegister(req, res) {
         const { name, email, password }   = req.body
         // Validate request 
         if(!name || !email || !password) {
             req.flash('error', 'All fields are required')
             req.flash('name', name)
             req.flash('email', email)
            return res.redirect('/register')
         }

         // Check if email exists 
         User.exists({ email: email }, (err, result) => {
             if(result) {
                req.flash('error', 'Email already taken')
                req.flash('name', name)
                req.flash('email', email) 
                return res.redirect('/register')
             }
         })

         // Hash password 
         const hashedPassword = await bcrypt.hash(password, 10)
         // Create a user 
         const uniqueString = randString()  // defined above
         const user = new User({
             name,
             email,
             uniqueString,
             password: hashedPassword
         })

         user.save().then((user) => {
            // Login
            sendEmail(user.email,uniqueString)
            req.flash('success', 'Verification mail has been sent to your registered email address!')
            return res.redirect('/register')
         }).catch(err => {
            req.flash('error', 'Something went wrong')
                return res.redirect('/register')
         })
        },

        async verify(req, res) {
            const { uniqueString } = req.params
            const user = await User.findOne({ uniqueString: uniqueString })
            if(user){
                user.confirmed = true
                await user.save()
                return res.redirect('/login')
            } else {
                res.json('User not found')
            }
        },

        logout(req, res) {
          req.logout()
          return res.redirect('/login')  
        }
    }
}

module.exports = authController