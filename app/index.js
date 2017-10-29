var express = require('express'),
    exphbs = require('express-handlebars'),
    argv = require('yargs').argv;

// Express setup
var app = express();

var hbs = exphbs.create({
    defaultLayout: 'main',
    helpers: {
        "each": function (context, options) {
            return context.reduce(function (ret, c) {
                return ret + options.fn(c);
            }, '');
        }
    }
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// locals
app.locals.title = 'Fictitious Store';

// initialize data store
var database = {
    items: [
        { id: 1, name: 'Blue Thing', price: 5.01, stock: 99, imageUrl: '' }
    ],
    orders: [],
    users: [],
    sessions: []
}

// Routes
app.use(express.static('assets'));

app.get('/test/allTheElements', function (req, res) {
    res.render('testAllTheElements');
});


app.get('/test/spa', function (req, res) {
    res.render('testSPA');
});

app.get('/', function (req, res) {
    //TODO: add a random selection to make testing harder
    // Situations:
    //	Anonymous users
    //	Potentially changing content
    var topItems = database.items.slice(0, 5);
    res.render('homepage', { topItems: topItems });
});

var port = argv.port || process.env.port;
app.listen(port, function () {
    console.log('Fictitious Company Inc App: Running on port ' + port);
})