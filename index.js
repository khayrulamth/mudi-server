const express = require('express')
require("dotenv").config();
var admin = require("firebase-admin");
const cors = require('cors');
const app = express()
const port = 4000
const ObjectId = require('mongodb').ObjectId;
const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.19mvk.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


//middleware

app.use(express.json());
app.use(cors());

//firebase admin sdk
var serviceAccount = require('./configs/simple-signin-2b017-firebase-adminsdk-zwa1x-a7c75069b5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

client.connect(err => {
  const mudiCollection = client.db("mudiStore").collection("products");
  const OrdersCollection = client.db("mudiStore").collection("orders");

  //sending new product to database
  app.post("/addProducts/", (req, res) => {
    const newProduct = req.body;
    mudiCollection.insertOne(newProduct)
      .then((res) => {
        console.log('from database', res);
      })
  })


  app.get('/products', (req, res) => {
    mudiCollection.find()
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.post('/ordered', (req, res) => {
    const currentOrder = req.body;
    OrdersCollection.insertOne(currentOrder)
      .then(res => {
        console.log("ordered", res);
      })
  })

  //JWT

  app.get('/previousOrders', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const uid = decodedToken.uid;
          let tokenEmail = decodedToken.email;
          if (tokenEmail === req.query.email) {
            OrdersCollection.find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents)
              })
          }
          else {
            res.status(401).send('Unauthorized access');
          }
        })
        .catch((error) => {
          // Handle error
        });
    }
    else {
      res.status(401).send('Unauthorized access');
    }

    // idToken comes from the client app
  })

  //edit db addProducts
  app.patch('/edit/:id', (req, res) => {
    mudiCollection.updateOne({ _id: ObjectId(req.params.id) },
      {
        $set: { name: req.body.name, price: req.body.price, quantity: req.body.quantity }
      }).then(result => console.log(result))

      .then(result => {
        console.log(result);
      })

  })

  //delete product from database

  app.delete('/delete/:id', (req, res) => {
    mudiCollection.deleteOne({ _id: ObjectId(req.params.id) })
      .then(result => {
        console.log(result);
      })
  })



});


app.get('/', (req, res) => {
  res.send('Hello my World!')
})

app.listen(process.env.PORT || port)