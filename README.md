# Project Title
# [Blogsy - Blogging Web Application](https://github.com/vishnukothakapu/Blogsy-Blogging-Web-App)
# Project Description 📃
This project is a fully functional blogging platform where users can register, log in, and interact with various blog posts. The platform supports user authentication through both traditional email/password methods and third-party OAuth providers like Google and GitHub. Users can write, edit, and delete their blog posts, as well as like and comment on posts by others. Additional features include password reset via OTP, the ability to update profile details, and a responsive user interface.

# Features Implemented ✨
## Frontend 🎨
+ **User Authentication: Login and registration pages with OTP verification.**
+ **Dashboard: Displays user-specific data including their posts and profile information.**
+ **Responsive UI: The entire platform is designed to be responsive and user-friendly on all devices.**
+ **File Uploading: Users can upload profile pictures and blog images.**
+ **Commenting System: Users can comment on blogs and reply to existing comments.**
+ **Blog Interactions: Users can like blog posts.**
+ **Blog Search: Users can search for blogs based on titles and tags.**
+ **Alert Messages: Informative messages are displayed to users for actions like successful registration, password reset, login errors, etc.**
  
## Backend 🧑🏻‍💻
+ **User Authentication: Supports both local authentication and OAuth (Google, GitHub) using Passport.js.**
+ **User Registration & OTP Verification: Users receive an OTP via email for account verification.**
+ **Session Management: Uses express-session to handle user sessions.**
+ **Multer Integration: Handles file uploads for profile pictures and blog images.**
+ **Blog Management: CRUD operations for blog posts, including tagging and image upload.**
+ **Comment & Reply System: Users can add comments and replies to blog posts.**
+ **Password Management: Users can update their password and reset it via email verification.**

  
# Technologies/Libraries/Packages Used 
## Frontend 🎨
+ **HTML & CSS** - For structuring and styling the application.
+ **JavaScript** - For client-side logic and interactions.
+ **EJS - For rendering dynamic web pages.**

## Backend 🧑🏻‍💻
+ **Node.js: Server-side JavaScript runtime.**
+ **Express.js: Web application framework for Node.js.**
+ **MongoDB with Mongoose: Database for storing user and blog data.**
+ **Passport.js: Authentication middleware for Node.js.**
+ **Multer: Middleware for handling multipart/form-data, used for file uploads.**
+ **Nodemailer: For sending OTP emails.**
+ **Session Management: Using `express-session` and `passport-session` to handle user sessions.**
  
## Tools ⚙️
+ **Postman**
+ **Git & Github**
+ **VsCode**
+ **Chrome**


# Local Setup 💻
## 1. Clone the repository
`git clone <repository-url`
`cd <repository-directory>`
## 2. Install Dependencies
` npm install `
## 3. Setup environment variables
+ **Create a `.env` file in your project and add the following**
  + `MONGO_URL=<YOUR MONGODB URL>`
  + `SECRET=<YOUR SECRET>`
  + `EMAIL=<YOUR EMAIL>`
  + `EMAIL_PASS=<YOUR EMAIL PASSWORD>`
  + `GOOGLE_CLIENT_ID=<YOUR GOOGLE CLIENT ID`
  + `GOOGLE_CLIENT_SECRET=<YOUR GOOGLE CLIENT SECRET>`
  + `GITHUB_CLIENT_ID=<YOUR GITHUB CLIENT ID>`
  + `GITHUB_CLIENT_SECRET=<YOUR GITHUB CLIENT SECRET>`
## 4. Run the development server
  `npm start`
  + The server will run on `http://localhost:4000`
## 5. Access the project application

 + Register a new user of login using Google or Github.
 + Explore the features of the web application by posting,editing,liking,commenting and replying the blogs.
   
# Team Members 👩🏻‍💻
+ **Kothakapu Vishnu Kiran** - `2023IMG-028`
+ **Sai Srikar Vollala** - `2023IMG-058`
+ **K Narain Varma** - `2023IMT-501`
