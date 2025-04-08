const MinimalExpress = require('./core/server');
const app = new MinimalExpress();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('<h1>Hello, World!</h1>');
});

app.get('/about', (req, res) => {
  res.json({ message: 'This is the About page' });
});

app.post('/data', (req, res) => {
  res.json({ received: req.body });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});