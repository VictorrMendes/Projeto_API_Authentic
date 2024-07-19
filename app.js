//Importing the required modules

require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()

//Confirg Json response
app.use(express.json())

//Models

const User = require('./models/User')

//Connecting to the database
app.get('/', (req, res) => {
    res.status(200).json({ msg: 'Hello World the my API' })
})

//Rota privada

app.get("/user/:id", checkToken, async (req, res) => {
    const id = req.params.id

    //Verificar se o usuario esta logado
    const user = await User.findById(id, '-password')

    if(!user) {
        return res.status(404).json({msg: "Usuario não encontrado!"})
    }

    res.status(200).json({ user })

})

//Check Token

function checkToken(req, res, next) {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if(!token) {
        return res.status(401).json({msg: "Token não encontrado!"})
    }

    try {
    const secret = process.env.SECRET

    jwt.verify(token, secret)

    next()

    }catch(err) {
        console.log(err)
        return res.status(400).json({msg: "Token invalido!"})
    }

}



//Register User

app.post('/auth/register', async (req, res) => {

    const {name, email, password, confirmpassword} = req.body

    //validação dos campos
    if(!name) {
        return res.status(422).json({msg: "O nome e obrigatorio !"})
    }

    if(!email) {
        return res.status(422).json({msg: "O email e obrigatorio !"})
    }

        if(!password) {
        return res.status(422).json({msg: "A senha e obrigatorio !"})
    }
    if(password !== confirmpassword) {
        return res.status(422).json({msg: "A senhas não conferem!"})
    }

    //Verificar se o email ja existe
    const userExists = await User.findOne({email: email})

    if(userExists) {
        return res.status(422).json({msg: "O email ja existe, utilize outro email!"})
    }

    //Criptografar a senha
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    //Criar um novo usuario
    const user = new User({
        name,
        email,
        password: passwordHash,
    })

    try {

        await user.save()

        res.status(201).json({msg: "Usuario registrado com sucesso!"})

    }catch(error) {

        console.log(error)
        res.status(500).json({msg: "Erro ao registrar o usuario"
        })
    }

})

//Login User

app.post('/auth/login', async (req, res) => {
    const {email, password} = req.body

    //Validação dos campos
    if(!email) {
        return res.status(422).json({msg: "O email e obrigatorio !"})
    }

        if(!password) {
        return res.status(422).json({msg: "A senha e obrigatorio !"})
    }

    //Verificar se o User existe
    const user = await User.findOne({email: email})

    if(!user) {
        return res.status(404).json({msg: "Usuario não encontrado!"})
    }

    //Verificar a senha
    const checkPassword = await bcrypt.compare(password, user.password)

    if(!checkPassword) {
        return res.status(422).json({msg: "Senha incorreta!"})
    }

    try{
        const secret = process.env.SECRET

        const token = jwt.sign(
        {
            id: user._id,
        }, 
        secret,
        )

        res.status(200).json({msg: "Usuario logado com sucesso!", token})
        
    } catch(err) {
        console.log(error)
        res.status(500).json({msg: "Erro ao registrar o usuario"
        })
    }

    //Gerar o token


})



//credenciais
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

const uri = `mongodb+srv://${dbUser}:${dbPassword}@project-api.ezxdlgl.mongodb.net/?retryWrites=true&w=majority&appName=Project-API`;



mongoose.connect(uri)
.then(() =>{
    console.log('Connected to the database')
    app.listen(3000)
}).catch((err) => {
    console.log(err)
})