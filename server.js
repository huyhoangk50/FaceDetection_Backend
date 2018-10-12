const express = require('express');
const app = express();
const bodyPasser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
require('dotenv').config()
const knex = require('knex');

const db = knex({
  client: process.env.CLIENT,
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database : process.env.DB
  }
});

app.use(bodyPasser.urlencoded({extended: false}));
app.use(bodyPasser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.json(database.users);
});

app.post('/signin', (req, res) => {
  const {email, password} = req.body;
  db('login').select('email', 'hash').where('email', '=', email)
    .then(loginInfo => {
      if(loginInfo.length){
        const hash = loginInfo[0].hash;
        if(bcrypt.compareSync(password, hash)){
          return db('users').select('*').where('email', '=', email)
            .then(user => {
              res.json(user[0]);
            })
            .catch(err => {
              console.log(err);
              res.status(400).json('unable to get user');
            });
        } else{
          return  res.status(400).json('wrong credentials');
        }
      }
    }).catch(err => {
      console.log(err);
      res.status(400).json('wrong credentials');
    });
});

app.post('/register', (req, res) => {
  const {name, email, password} = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx.insert({
      email: email,
      hash: hash
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
      return trx('users')
      .returning('*')
      .insert({
        email: loginEmail[0],
        name: name,
        joined: new Date()
      })
      .then(user => {
        console.log(user);
        res.json(user[0]);
      })
    })
    .then(trx.commit)
    .catch(trx.rollback)
      
  })
  .then(resp => {
    console.log(resp);
    console.log('Transaction complete.');
  })
  .catch(err => res.status(400).json('unable to create account'));
  // .catch(err => res.status(400).json('unable to create account'));
});

app.get('/profile/:id', (req, res) => {
  const {id} = req.params;
  db.select('*').from('users').where({id})
  .then(user => {
    if(user.length){
      res.send(user[0]);
    } else{
      res.status(400).json('not found');
    }
  }).catch(err => {
    res.status(400).json('err from getting user');
  });
});

app.put('/image', (req, res) => {
  const {id} = req.body;
  db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
      res.json(entries[0]);
    })
    .catch(err => {
      res.status(400).json('unable to get entries');
    });
});

app.listen(3000, () => {
  console.log("App is running in port 3000!");
});