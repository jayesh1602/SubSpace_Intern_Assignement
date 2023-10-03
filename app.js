const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
  let Greet = "Welcome to SubSpace !";
  let Blog_Stats = "Get Blog stats at - /api/blog-stats";
  let Blog_Search = "Search With Query - /api/blog-search?query=Your_Query";
  res.json({
    Greet,
    Blog_Stats,
    Blog_Search,
  });
});

// Middleware to fetch blog data
const fetchBlogData = async () => {
  try {
    // Make the curl request to fetch blog data
    const response = await axios.get(
      "https://intent-kit-16.hasura.app/api/rest/blogs",
      {
        headers: {
          "x-hasura-admin-secret":
            "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6",
        },
      }
    );

    const blogs = response.data.blogs;
    const totalBlogs = blogs.length;
    console.log("lenght is : ", blogs.length);
    const longestTitleBlog = _.maxBy(blogs, "title.length");
    console.log("longest title", longestTitleBlog);

    const blogsWithPrivacy = _.filter(blogs, (blog) =>
      _.includes(_.toLower(blog.title), "privacy")
    );
    const uniqueBlogTitles = _.uniqBy(blogs, "title");

    // Prepare the response JSON object
    const responseData = {
      totalBlogs,
      longestBlogTitle: longestTitleBlog.title,
      blogsWithPrivacy: blogsWithPrivacy.length,
      uniqueBlogTitles: _.map(uniqueBlogTitles, "title"),
    };

    return responseData;
  } catch (error) {
    // Handle errors
    throw new Error("Error fetching or analyzing blog data: " + error.message);
  }
};

const memoizedFetchBlogData = _.memoize(fetchBlogData, () => {
  // Set the cache expiration time (e.g., 1 hour)
  return Date.now() - 3600000;
});

// Middleware for /api/blog-stats route
//Use of Lodash
app.get("/api/blog-stats", async (req, res) => {
  try {
    // Fetch and analyze blogs, using the memoized function
    const responseData = await memoizedFetchBlogData();

    // Send the response to the client
    res.json(responseData);
  } catch (error) {
    // Handle errors
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

let storeBlogs;
const storeAllBlogs = async () => {
  const response = await axios.get(
    "https://intent-kit-16.hasura.app/api/rest/blogs",
    {
      headers: {
        "x-hasura-admin-secret":
          "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6",
      },
    }
  );

  return response.data.blogs;
};
const memoizedFetchBlogData2 = _.memoize(storeAllBlogs, () => {
  // Set the cache expiration time (e.g., 1 hour)
  return Date.now() - 3600000;
});

//middleware to search Blogs By query
app.get("/api/blog-search", async (req, res) => {
  const query = req.query.query.toLowerCase();

  try {
    const responseData = await memoizedFetchBlogData2();

    const filteredBlogs = _.filter(responseData, (blog) =>
      _.includes(_.toLower(blog.title), query)
    );

    // Respond with the filtered blogs
    res.json(filteredBlogs);
  } catch (error) {
    console.error("Error searching blogs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//listening on port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
