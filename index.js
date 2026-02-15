import express from "express";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "books",
  password: "781506",
  port: 5432,
});
db.connect();

async function bookReview() {
  const books = await db.query("Select * from books ORDER BY books.id ASC");
  //need to format date_read since it reads as JS date vs sql date the {} is to signify an object
  const formattedBooks = books.rows.map(formatBookDate);
  // const formattedBook = books.rows.map((book, index) => {
  //   if (index % 2 === 0){
  //     return ({
  //       ...book,
  //       //ternary string used to check if book.date_read is available then change it's format, else make it null
  //       date_read: book.date_read
  //         ? new Date(book.date_read).toLocaleDateString("en-GB")
  //         : null,
  //     })}
  //   else return book;
  // });

  return formattedBooks;
}

function formatBookDate(book) {
  return {
    ...book,
    //ternary string used to check if book.date_read is available then change it's format, else make it null
    date_read: book.date_read
      ? new Date(book.date_read).toLocaleDateString("en-GB")
      : null,
  };
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  const books = await bookReview();
  // console.log("this is book List", books.rows)
  res.render("index.ejs", {
    //no longer added.rows to books since we've already done that
    bookList: books,
  });
});

//remove reviews page since it's already in the homepage?
// app.get("/reviews", async (req,res)=>{
//   res.render("reviews.ejs");
// });

app.get("/review/:id", async (req, res) => {
  console.log("called");
  const bookIndex = parseInt(req.params.id);
  const retrievedData = await db.query("SELECT * from books WHERE id = $1", [
    bookIndex,
  ]);

  console.log("retrieved Data", retrievedData.rows);
  console.log("first book", retrievedData.rows[0]);

  const book = formatBookDate(retrievedData.rows[0]);

  console.log("formatted book", book);

  res.render("review.ejs", { book });
});

app.get("/input-review", async (req, res) => {
  res.render("input-review.ejs");
});

app.post("/addreview", async (req, res) => {
  const { cover, title, review, rating, date_read } = req.body;
  try {
    //if !{title, reveiew, etc} it will always be true since objects are truthy
    if (!cover || !title || !review || !rating || !date_read) {
      throw new Error("Please fill in all fields");
    } else {
      await db.query(
        "INSERT INTO books (cover, title, review, rating, date_read) VALUES ($1, $2, $3, $4, $5)",
        [cover, title, review, rating, date_read],
      );
      res.redirect("/");
    }
  } catch (error) {
    const books = await bookReview();
    res.render("index.ejs", {
      bookList: books.rows,
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
