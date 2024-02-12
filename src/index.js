import express from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import collection from './user.js'
import Weather from './data.js'
import NewsHistory from './newsData.js'
import https from 'https';
import axios from 'axios';
import bodyParser from 'body-parser';
import { body,validationResult  } from "express-validator";


import {registerValidation, loginValidator} from './validation.js'



const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs')
app.use(express.static("public"))

const __dirname = process.cwd();
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) =>{
    res.render('login')
})

app.get('/weather',(req, res) =>{
    res.render('weather')
})

app.get('/home', (req, res) =>{
    res.render('home')
})

app.get('/login', (req, res) =>{
    res.render('login')
})

app.get('/index', (req, res) =>{
    res.render('index')
})

app.get('/productindex', (req, res) =>{
    res.render('productsindex')
})

/* Product */
app.get('/product', async (req, res) => {
    try {
        const productData = await fetchMultipleProducts(); // Fetch data for multiple products
        res.render('product', { productData });
    } catch (error) {
        console.error('Error fetching product data:', error.message);
        res.status(500).send('Failed to fetch product data.');
    }
});

async function fetchMultipleProducts() {
    try {
        const productPromises = [];
        // Fetch data for 15 products
        for (let i = 1; i <= 15; i++) {
            productPromises.push(axios.get(`https://dummyjson.com/products/${i}`));
        }
        // Wait for all requests to resolve
        const products = await Promise.all(productPromises);
        // Extract product data from responses
        const productData = products.map(response => response.data);
        return productData;
    } catch (error) {
        throw new Error('Failed to fetch product data.');
    }
}

/* News api */
const newsApiUrl = 'https://newsapi.org/v2/top-headlines?' +
'country=us&' +
'apiKey=ac3a849991fd40a198b6f950fea93b99';

app.get('/news', async (req, res) => {
    try {
        const response = await axios.get(newsApiUrl);
        const articles = response.data.articles;
        
        // Check if articles exist and have data
        if (articles && articles.length > 0) {
            // Render the news page with the fetched articles
            res.render('news', { articles });
        } else {
            // Render the news page with a message if no articles found
            res.render('news', { articles: null, message: 'No news articles found.' });
        }
    } catch (error) {
        console.error('Error fetching news:', error.message);
        
        // Check if error.response exists before accessing its properties
        if (error.response && error.response.status) {
            console.error('Status code:', error.response.status);
        }
        
        // Send a 500 status and error message
        res.status(500).send('Failed to fetch news.');
    }
});

// Route to fetch news history from the database
app.get('/historyNews', async (req, res) => {
    try {
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to midnight

        // Find news articles created today
        const newsHistory = await NewsHistory.find({ createdAt: { $gte: today } }).sort({ createdAt: -1 });

        if (newsHistory.length > 0) {
            res.render('historyNews', { newsHistory });
        } else {
            res.render('historyNews', { newsHistory: [] }); // Pass an empty array if no data found
        }
    } catch (error) {
        console.error('Error fetching news history:', error.message);
        res.status(500).send('Failed to fetch news history.');
    }
});

/* FORM */
app.get('/signup', (req, res) =>{
    res.render('signup')
})

app.post('/signup', registerValidation,async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const data = {
        name: req.body.username,
        password: req.body.password
    }

    const existingUser = await collection.findOne({name: data.name})
    if(existingUser) {
        res.send("User already exists. Please choose a new one")
    }else{
        const salt = 10;
        const hash = await bcrypt.hash(data.password,salt)

        data.password = hash
        const userData = await collection.insertMany(data)
        console.log(userData)
        res.render('login')
    }
})  

// Route to handle user editing
app.post('/edit-user', async (req, res) => {
    const userId = req.body.userId;
    const newName = req.body.newName; // Assuming you want to edit the name
    try {
      await collection.findByIdAndUpdate(userId, { name: newName });
      res.redirect('/admin'); // Redirect to the users page after editing
    } catch (error) {
      console.error('Error editing user:', error.message);
      res.status(500).send('Failed to edit user.');
    }
  });
  
// Route to handle user deletion
app.delete('/delete-user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        await collection.findByIdAndDelete(userId);
        res.redirect('/admin'); // Redirect to the users page after deletion
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).send('Failed to delete user.');
    }
});

app.get('/admin', async (req, res) => {
    try {
      const users = await collection.find();
      res.render('admin', { users });
    } catch (error) {
      console.error('Error fetching users:', error.message);
      res.status(500).send('Failed to fetch users.');
    }
  });

app.post('/login',loginValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try{
        const check = await collection.findOne({name:req.body.username});
        if(!check){
            res.send("user name cannot find ")
        }

        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password)
        if (req.body.username === "Nuradil" && req.body.password === "12345") {
            res.redirect('/admin');
        }
        else if(isPasswordMatch){
          res.render('home')
        }else{
            req.send("wrong password")
        }

    }catch(e){
        console.log(e)
    }
})

/* OpenWeather */
const api = "dc7e0008c99adc1f1c05713d44e74b9e" 

app.get('/historyWeather', async (req, res) => {
    try {
        const historyWeather = await Weather.find().sort({ createdAt: -1 });
        res.render('historyWeather', { historyWeather: historyWeather });
    } catch (error) {
        console.error('Error fetching weather history:', error.message);
        res.status(500).send('Failed to fetch weather history.');
    }
});

app.post('/weather', (req, res) => {
    const city = req.body.city;
    const url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + api + "&units=metric";

    https.get(url, (response) => {
        let data = '';
        response.on("data", (chunk) => {
            data += chunk;
        });
        response.on("end", async () => {
            const weatherData = JSON.parse(data);
            console.log(weatherData);
            const temp = weatherData.main.temp;
            const description = weatherData.weather[0].description;
            const icon = weatherData.weather[0].icon;
            const imageURL = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
            const windSpeed = weatherData.wind.speed;

            try {
                await Weather.create({
                    city: city,
                    temperature: temp,
                    description: description,
                    icon: icon,
                    imageURL: imageURL,
                    windSpeed: windSpeed // Saving wind speed to the database
                });

                res.write("<!DOCTYPE html><html><head><title>Weather</title>");
                res.write("<style>body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; }");
                res.write("h2 { color: #333; margin-bottom: 10px; }");
                res.write("p { color: #555; margin-bottom: 20px; }");
                res.write("img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }");
                res.write("button { background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }");
                res.write("button:hover { background-color: #45a049; }");
                res.write("</style>");
                res.write("</head><body>");

                res.write("<h1>Weather Information for " + city + "</h1>");
                res.write("<h2>Temperature: " + temp + "°C</h2>");
                res.write("<p>Weather: " + description + "</p>");
                res.write("<p>Wind Speed: " + windSpeed + " m/s</p>"); // Displaying wind speed
                res.write("<img src='" + imageURL + "' alt='Weather Icon'>");
                res.write("<button onclick='window.history.back()'>Go Back</button>");

                res.write("</body></html>");
                res.send();

                console.log('Weather data saved successfully.');
            } catch (error) {
                console.error('Error saving weather data:', error.message);
                res.status(500).send("Error saving weather data");
            }
        });
    }).on("error", (err) => {
        console.error("Error: " + err.message);
        res.status(500).send("Error fetching weather data");
    });
});


const port = 3000;
app.listen(process.env.PORT || port,()=>{
    console.log('listening on port')
});