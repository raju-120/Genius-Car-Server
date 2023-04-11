const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectID } = require('bson');
const { SslCommerzPayment } = require('sslcommerz');
require('dotenv').config();



const app = express();
const port = process.env.PORT || 5000;


const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASS
const is_live = false //true for live, false for sandbox

/* console.log(process.env.STORE_ID);
console.log(process.env.STORE_PASS); */

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mgijdnm.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'});
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
}


async function run(){
    try{
        const serviceCollection = client.db('geniusCar').collection('services');
        const orderCOllection = client.db('geniusCar').collection('orders');

        app.post('/jwt', (req, res) =>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '56861d' });
            res.send({token});
        })

        app.get('/services', async(req, res) =>{
            const search = req.query.search;
            console.log(search);
            const query = {};
            //const query = {price: {$gt: 100, $lt: 300}}
            //const query = {price: {$eq: 150}}
            //const query = {price: {$lte: 250}}
           7//const query = {price: {$ne: 150}}
            //const query = {price: {$in: [80, 50,250]}}
            //const query = {price: {$nin: [80, 50,250]}}
            //const query = {$and: [{price: {$gt: 20}},{price: {$gt: 100}} ]}
            const order = req.query.order === 'asc' ? 1 : -1;
            const cursor = serviceCollection.find(query).sort({price: order});
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
        app.get('/orders', verifyJWT, async(req, res) => {
            
            const decoded = req.decoded;
            console.log('inside order api',decoded);
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'Forbidden Access'})
            }

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

        app.post('/orders',verifyJWT, async(req, res) =>{
            const order = req.body;
            
            const orderService = await serviceCollection.findOne ({ _id : ObjectID (order.services)})
           
            console.log(orderService);
            res.send(orderService)

            
        }) 
    

        app.patch('/orders/:id',verifyJWT, async (req, res) => {
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

        app.delete('/orders/:id',verifyJWT, async(req, res) =>{
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