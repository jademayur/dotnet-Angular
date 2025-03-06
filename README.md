using SMS.Models;
using System.Data;
using System.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace SMS.DAL
{
    public class UserRepository
    {
        private readonly string _connectionString;

        public UserRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("ConnectionString");
        }

        public User ValidateUser(string username, string password)
        {
            User user = null;
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string query = "select Id, UserName, Role from Users where UserName = @username And Password = @password";

                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Username", username);
                cmd.Parameters.AddWithValue("@password", password);

                conn.Open();
                SqlDataReader reader = cmd.ExecuteReader();

                if(reader.Read())
                {
                    user = new User
                    {
                       Id = reader.GetInt32(0),
                       UserName = reader.GetString(1),
                       Role = reader.GetString(2)
                    };
                }
                reader.Close();
            }
            return user;
        }

        public List<User> GetAllUsers()
        {
            List<User> users = new List<User>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string query = "SELECT * FROM Users";
                SqlCommand cmd = new SqlCommand(query, conn);
                conn.Open();

                SqlDataReader reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    users.Add(new User
                    {
                        Id = (int)reader["Id"],
                        UserName = reader["UserName"].ToString(),
                        Email = reader["Email"].ToString(),
                        Role = reader["Role"].ToString()
                    });
                }
            }
            return users;
        }
        // Get a User by ID
        public User GetUserById(int id)
        {
            User user = null;
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string query = "SELECT * FROM Users WHERE Id = @Id";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);

                conn.Open();
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    user = new User
                    {
                        Id = (int)reader["Id"],
                        UserName = reader["UserName"].ToString(),
                        Email = reader["Email"].ToString(),
                        Role = reader["Role"].ToString()
                    };
                }
            }
            return user;
        }

        // Insert User
        public void AddUser(User user)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string query = "INSERT INTO Users (UserName, Email, Password, Role) VALUES (@UserName, @Email, @Password, @Role)";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@UserName", user.UserName);
                cmd.Parameters.AddWithValue("@Email", user.Email);
                cmd.Parameters.AddWithValue("@Password", user.Password); // Hash password in real apps
                cmd.Parameters.AddWithValue("@Role", user.Role);

                conn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        // Update User
        public void UpdateUser(User user)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string query = "UPDATE Users SET UserName=@UserName,Email=@Email, Role=@Role WHERE Id=@Id";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", user.Id);
                cmd.Parameters.AddWithValue("@UserName", user.UserName);
                cmd.Parameters.AddWithValue("@Email", user.Email);
                cmd.Parameters.AddWithValue("@Role", user.Role);

                conn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        // Delete User
        public void DeleteUser(int id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string query = "DELETE FROM Users WHERE Id = @Id";
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);

                conn.Open();
                cmd.ExecuteNonQuery();
            }
        }

    }
}
----------------------
using Microsoft.AspNetCore.Mvc;
using SMS.DAL;
using SMS.Models;
using Microsoft.AspNetCore.Http;

namespace SMS.Controllers
{
    public class UserController : Controller
    {
        private readonly UserRepository _userRepository;

        public UserController(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Login(User userModel)
        {
            if(ModelState.IsValid)
            {
                var user = _userRepository.ValidateUser(userModel.UserName, userModel.Password);

                if(user != null)
                {
                    HttpContext.Session.SetString("Username", user.UserName);
                    HttpContext.Session.SetString("Role", user.Role);

                    return RedirectToAction("Index", "User");

                }
                else
                {
                    ViewBag.ErrorMessage = "Invalid Username or Password";
                }
            }
            return View();
        }

        // List Users
        public IActionResult Index()
        {
            List<User> users = _userRepository.GetAllUsers();
            return View(users);
        }
        // Create User (GET)
        public IActionResult Create()
        {
            return View();
        }

        // Create User (POST)
        [HttpPost]
        public IActionResult Create(User user)
        {
            if (ModelState.IsValid)
            {
                _userRepository.AddUser(user);
                return RedirectToAction("Index");
            }
            return View(user);
        }

        // Edit User (GET)
        public IActionResult Edit(int id)
        {
            User user = _userRepository.GetUserById(id);
            return View(user);
        }

        // Edit User (POST)
        [HttpPost]
        public IActionResult Edit(User user)
        {
            if (ModelState.IsValid)
            {
                _userRepository.UpdateUser(user);
                return RedirectToAction("Index");
            }
            return View(user);
        }

        // Delete User (GET)
        public IActionResult Delete(int id)
        {
            User user = _userRepository.GetUserById(id);
            return View(user);
        }

        // Delete User (POST)
        [HttpPost, ActionName("Delete")]
        public IActionResult DeleteConfirmed(int id)
        {
            _userRepository.DeleteUser(id);
            return RedirectToAction("Index");
        }


        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Login");
        }
    }
}
----------------
using SMS.DAL;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<UserRepository>(); // 

builder.Services.AddSession(); //
builder.Services.AddHttpContextAccessor();//

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseSession(); //user Session
app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
