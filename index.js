const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectID } = require('bson');
require('dotenv').config();

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mgijdnm.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const serviceCollection = client.db('geniusCar').collection('services');
        const orderCOllection = client.db('geniusCar').collection('orders');

        app.get('/services', async(req, res) =>{
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });
        app.get('/services/:id', async(req,res) =>{
            const id = req.params.id;
            const query = {_id: ObjectID(id)}
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        //orders API
        app.get('/orders', async(req, res) => {
            let query = {};
            if(req.query.email){
                query= {
                    email: req.query.email
                }
            }
            const cursor = orderCOllection.find(query);
            const order = await cursor.toArray();
            res.send(order);
        })

        app.post('/orders', async(req, res) =>{
            const order = req.body;
            const result = await orderCOllection.insertOne(order);
            res.send(result);
        });

        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectID(id) }
            const updatedDoc = {
                $set:{
                    status: status
                }
            }
            const result = await orderCOllection.updateOne(query, updatedDoc);
            res.send(result);
        })

        app.delete('/orders/:id', async(req, res) =>{
            const id = req.params.id;
            const query =  {_id: ObjectID(id)};
            const result = await orderCOllection.deleteOne(query);
            res.send(result);
        })
    }
    finally{}
}
run().catch(err => console.error(err));

app.get('/', (req , res) =>{
    res.send('genius car server is running')
})

app.listen(port, () =>{
    console.log(`Genius Car server running on ${port}`);
})